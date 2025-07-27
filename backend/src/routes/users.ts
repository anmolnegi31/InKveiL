import { Response } from 'express';
import User from '../models/User';
import Connection from '../models/Connection';
import { AuthenticatedRequest } from '../middleware/auth';
import { UpdateProfileRequest, UpdatePreferencesRequest, DiscoverUsersQuery } from '../schemas/user';

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile retrieved successfully',
      user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateProfile = async (req: AuthenticatedRequest<{}, {}, UpdateProfileRequest>, res: Response) => {
  try {
    const userId = req.user!.userId;
    const updateData = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { ...updateData, updatedAt: new Date() },
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePreferences = async (req: AuthenticatedRequest<{}, {}, UpdatePreferencesRequest>, res: Response) => {
  try {
    const userId = req.user!.userId;
    const preferencesData = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      { 
        $set: {
          'preferences.ageRange': preferencesData.ageRange,
          'preferences.maxDistance': preferencesData.maxDistance,
          'preferences.genderPreference': preferencesData.genderPreference,
          'preferences.intentPreference': preferencesData.intentPreference,
          updatedAt: new Date()
        }
      },
      { new: true, select: '-password' }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      message: 'Preferences updated successfully',
      user
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const discoverUsers = async (req: AuthenticatedRequest<{}, {}, {}, DiscoverUsersQuery>, res: Response) => {
  try {
    const userId = req.user!.userId;
    const {
      page = 1,
      limit = 20,
      minAge,
      maxAge,
      gender,
      intent,
      maxDistance
    } = req.query;

    // Get current user to access their preferences and location
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get users that current user has already connected with or sent requests to
    const existingConnections = await Connection.find({
      $or: [
        { requesterId: userId },
        { receiverId: userId }
      ]
    }).select('requesterId receiverId');

    const excludedUserIds = existingConnections.flatMap(conn => [
      conn.requesterId.toString(),
      conn.receiverId.toString()
    ]);
    excludedUserIds.push(userId); // Exclude self

    // Build query filters
    const filters: any = {
      _id: { $nin: excludedUserIds },
      isVerified: true // Only show verified users
    };

    // Apply age filters (use preferences if not specified)
    const ageMin = minAge || currentUser.preferences.ageRange.min;
    const ageMax = maxAge || currentUser.preferences.ageRange.max;
    filters.age = { $gte: ageMin, $lte: ageMax };

    // Apply gender filter (use preferences if not specified)
    const genderPref = gender || currentUser.preferences.genderPreference;
    if (genderPref !== 'both') {
      filters.gender = genderPref;
    }

    // Apply intent filter (use preferences if not specified)
    const intentPref = intent || currentUser.preferences.intentPreference;
    if (intentPref !== 'both') {
      filters.intent = { $in: [intentPref, 'both'] };
    }

    // Calculate distance filter if maxDistance is specified
    if (maxDistance && currentUser.location) {
      const distanceInRadians = maxDistance / 6371; // Earth's radius in km
      filters.location = {
        $geoWithin: {
          $centerSphere: [
            [currentUser.location.longitude, currentUser.location.latitude],
            distanceInRadians
          ]
        }
      };
    }

    const skip = (page - 1) * limit;

    // Find users with filters
    const users = await User.find(filters)
      .select('-password -email -phone -preferences')
      .sort({ lastActive: -1 })
      .skip(skip)
      .limit(limit);

    // Calculate distance for each user
    const usersWithDistance = users.map(user => {
      let distance = null;
      if (currentUser.location && user.location) {
        distance = calculateDistance(
          currentUser.location.latitude,
          currentUser.location.longitude,
          user.location.latitude,
          user.location.longitude
        );
      }
      
      return {
        ...user.toObject(),
        distance: distance ? Math.round(distance) : null
      };
    });

    const totalUsers = await User.countDocuments(filters);
    const totalPages = Math.ceil(totalUsers / limit);

    res.json({
      message: 'Users discovered successfully',
      users: usersWithDistance,
      pagination: {
        currentPage: page,
        totalPages,
        totalUsers,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Discover users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserById = async (req: AuthenticatedRequest<{ userId: string }>, res: Response) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user!.userId;

    const user = await User.findById(userId).select('-password -email -phone');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if there's an existing connection
    const connection = await Connection.findOne({
      $or: [
        { requesterId: currentUserId, receiverId: userId },
        { requesterId: userId, receiverId: currentUserId }
      ]
    });

    // Calculate distance if both users have location
    const currentUser = await User.findById(currentUserId);
    let distance = null;
    if (currentUser?.location && user.location) {
      distance = calculateDistance(
        currentUser.location.latitude,
        currentUser.location.longitude,
        user.location.latitude,
        user.location.longitude
      );
    }

    res.json({
      message: 'User retrieved successfully',
      user: {
        ...user.toObject(),
        distance: distance ? Math.round(distance) : null
      },
      connectionStatus: connection ? connection.status : null
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // In a production app, you might want to:
    // 1. Soft delete instead of hard delete
    // 2. Clean up related data (connections, messages, etc.)
    // 3. Send confirmation email
    
    await User.findByIdAndDelete(userId);

    res.json({ message: 'Profile deleted successfully' });
  } catch (error) {
    console.error('Delete profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
