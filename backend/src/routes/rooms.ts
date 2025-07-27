import { Response } from 'express';
import Room from '../models/Room';
import User from '../models/User';
import Notification from '../models/Notification';
import { AuthenticatedRequest } from '../middleware/auth';
import { CreateRoomRequest, GetRoomsQuery, UpdateRoomRequest } from '../schemas/room';

export const createRoom = async (req: AuthenticatedRequest<{}, {}, CreateRoomRequest>, res: Response) => {
  try {
    const userId = req.user!.userId;
    const roomData = req.body;

    // Verify user has premium subscription
    const user = await User.findById(userId);
    if (!user?.isPremium) {
      return res.status(403).json({ error: 'Premium subscription required to create rooms' });
    }

    // Validate scheduled date if provided
    if (roomData.scheduledFor && roomData.scheduledFor < new Date()) {
      return res.status(400).json({ error: 'Scheduled date must be in the future' });
    }

    // Create room
    const room = new Room({
      ...roomData,
      createdBy: userId,
      participantIds: [userId] // Creator automatically joins
    });

    await room.save();

    // Populate creator info
    await room.populate('createdBy', 'name photoURL');

    res.status(201).json({
      message: 'Room created successfully',
      room
    });
  } catch (error) {
    console.error('Create room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRooms = async (req: AuthenticatedRequest<{}, {}, {}, GetRoomsQuery>, res: Response) => {
  try {
    const userId = req.user!.userId;
    const {
      roomType,
      tags,
      isPrivate,
      scheduled,
      page = 1,
      limit = 20
    } = req.query;

    // Verify user has premium subscription
    const user = await User.findById(userId);
    if (!user?.isPremium) {
      return res.status(403).json({ error: 'Premium subscription required to view rooms' });
    }

    // Build query filters
    const filters: any = {
      isActive: true,
      subscriptionRequired: true
    };

    if (roomType) {
      filters.roomType = roomType;
    }

    if (tags && tags.length > 0) {
      filters.tags = { $in: tags };
    }

    if (isPrivate !== undefined) {
      filters.isPrivate = isPrivate;
    }

    // Handle scheduled filter
    if (scheduled) {
      const now = new Date();
      switch (scheduled) {
        case 'upcoming':
          filters.scheduledFor = { $gt: now };
          break;
        case 'live':
          filters.$or = [
            { scheduledFor: null }, // Not scheduled (always live)
            {
              scheduledFor: { $lte: now },
              $expr: {
                $gte: [
                  { $add: ["$scheduledFor", { $multiply: ["$duration", 60000] }] }, // scheduledFor + duration in ms
                  now
                ]
              }
            }
          ];
          break;
        case 'past':
          filters.scheduledFor = { $lt: now };
          filters.$expr = {
            $lt: [
              { $add: ["$scheduledFor", { $multiply: ["$duration", 60000] }] },
              now
            ]
          };
          break;
      }
    }

    // Don't show private rooms unless user is a participant
    if (isPrivate !== true) {
      filters.$or = [
        { isPrivate: false },
        { participantIds: userId }
      ];
    }

    const skip = (page - 1) * limit;

    // Get rooms
    const rooms = await Room.find(filters)
      .populate('createdBy', 'name photoURL')
      .populate('participantIds', 'name photoURL')
      .sort({ 
        scheduledFor: scheduled === 'upcoming' ? 1 : -1,
        createdAt: -1 
      })
      .skip(skip)
      .limit(limit);

    // Add computed fields
    const roomsWithMetadata = rooms.map(room => {
      const roomObj = room.toObject();
      const now = new Date();
      
      let status = 'upcoming';
      if (!room.scheduledFor) {
        status = 'live';
      } else if (room.scheduledFor <= now) {
        const endTime = new Date(room.scheduledFor.getTime() + (room.duration || 60) * 60000);
        status = endTime > now ? 'live' : 'ended';
      }

      return {
        ...roomObj,
        status,
        participantCount: room.participantIds.length,
        spotsAvailable: room.maxParticipants - room.participantIds.length,
        isParticipant: room.participantIds.some(p => p._id.toString() === userId),
        isCreator: room.createdBy._id.toString() === userId
      };
    });

    const totalRooms = await Room.countDocuments(filters);
    const totalPages = Math.ceil(totalRooms / limit);

    res.json({
      message: 'Rooms retrieved successfully',
      rooms: roomsWithMetadata,
      pagination: {
        currentPage: page,
        totalPages,
        totalRooms,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getRoomById = async (req: AuthenticatedRequest<{ roomId: string }>, res: Response) => {
  try {
    const { roomId } = req.params;
    const userId = req.user!.userId;

    // Verify user has premium subscription
    const user = await User.findById(userId);
    if (!user?.isPremium) {
      return res.status(403).json({ error: 'Premium subscription required to view rooms' });
    }

    const room = await Room.findById(roomId)
      .populate('createdBy', 'name photoURL bio')
      .populate('participantIds', 'name photoURL bio');

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user can view this private room
    if (room.isPrivate && !room.participantIds.some(p => p._id.toString() === userId)) {
      return res.status(403).json({ error: 'Access denied to private room' });
    }

    // Add computed fields
    const now = new Date();
    let status = 'upcoming';
    if (!room.scheduledFor) {
      status = 'live';
    } else if (room.scheduledFor <= now) {
      const endTime = new Date(room.scheduledFor.getTime() + (room.duration || 60) * 60000);
      status = endTime > now ? 'live' : 'ended';
    }

    const roomWithMetadata = {
      ...room.toObject(),
      status,
      participantCount: room.participantIds.length,
      spotsAvailable: room.maxParticipants - room.participantIds.length,
      isParticipant: room.participantIds.some(p => p._id.toString() === userId),
      isCreator: room.createdBy._id.toString() === userId
    };

    res.json({
      message: 'Room retrieved successfully',
      room: roomWithMetadata
    });
  } catch (error) {
    console.error('Get room by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const joinRoom = async (req: AuthenticatedRequest<{ roomId: string }>, res: Response) => {
  try {
    const { roomId } = req.params;
    const userId = req.user!.userId;

    // Verify user has premium subscription
    const user = await User.findById(userId);
    if (!user?.isPremium) {
      return res.status(403).json({ error: 'Premium subscription required to join rooms' });
    }

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if room is active
    if (!room.isActive) {
      return res.status(400).json({ error: 'Room is not active' });
    }

    // Check if user is already a participant
    if (room.participantIds.includes(userId as any)) {
      return res.status(400).json({ error: 'Already a participant in this room' });
    }

    // Check if room is full
    if (room.participantIds.length >= room.maxParticipants) {
      return res.status(400).json({ error: 'Room is full' });
    }

    // Check if room has started (for scheduled rooms)
    if (room.scheduledFor) {
      const now = new Date();
      const endTime = new Date(room.scheduledFor.getTime() + (room.duration || 60) * 60000);
      
      if (now > endTime) {
        return res.status(400).json({ error: 'Room has ended' });
      }
    }

    // Add user to room
    room.participantIds.push(userId as any);
    await room.save();

    // Create notification for room creator
    const notification = new Notification({
      userId: room.createdBy,
      type: 'room_invitation',
      title: 'New Room Participant',
      message: `${user.name} joined your room "${room.roomName}"`,
      data: { roomId: room._id, participantId: userId }
    });
    await notification.save();

    // Populate data for response
    await room.populate([
      { path: 'createdBy', select: 'name photoURL' },
      { path: 'participantIds', select: 'name photoURL' }
    ]);

    res.json({
      message: 'Successfully joined room',
      room
    });
  } catch (error) {
    console.error('Join room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const leaveRoom = async (req: AuthenticatedRequest<{ roomId: string }>, res: Response) => {
  try {
    const { roomId } = req.params;
    const userId = req.user!.userId;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if user is a participant
    if (!room.participantIds.includes(userId as any)) {
      return res.status(400).json({ error: 'Not a participant in this room' });
    }

    // Remove user from room
    room.participantIds = room.participantIds.filter(id => id.toString() !== userId);
    
    // If creator leaves and there are other participants, transfer ownership to first participant
    if (room.createdBy.toString() === userId && room.participantIds.length > 0) {
      room.createdBy = room.participantIds[0];
    }
    
    // If no participants left, deactivate room
    if (room.participantIds.length === 0) {
      room.isActive = false;
    }

    await room.save();

    res.json({ message: 'Successfully left room' });
  } catch (error) {
    console.error('Leave room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateRoom = async (req: AuthenticatedRequest<{ roomId: string }, {}, UpdateRoomRequest>, res: Response) => {
  try {
    const { roomId } = req.params;
    const userId = req.user!.userId;
    const updateData = req.body;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Only creator can update room
    if (room.createdBy.toString() !== userId) {
      return res.status(403).json({ error: 'Only room creator can update room details' });
    }

    // Validate scheduled date if provided
    if (updateData.scheduledFor && updateData.scheduledFor < new Date()) {
      return res.status(400).json({ error: 'Scheduled date must be in the future' });
    }

    // Don't allow reducing max participants below current participant count
    if (updateData.maxParticipants && updateData.maxParticipants < room.participantIds.length) {
      return res.status(400).json({ 
        error: `Cannot reduce max participants below current participant count (${room.participantIds.length})` 
      });
    }

    // Update room
    Object.assign(room, updateData);
    await room.save();

    // Populate data for response
    await room.populate([
      { path: 'createdBy', select: 'name photoURL' },
      { path: 'participantIds', select: 'name photoURL' }
    ]);

    res.json({
      message: 'Room updated successfully',
      room
    });
  } catch (error) {
    console.error('Update room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteRoom = async (req: AuthenticatedRequest<{ roomId: string }>, res: Response) => {
  try {
    const { roomId } = req.params;
    const userId = req.user!.userId;

    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Only creator can delete room
    if (room.createdBy.toString() !== userId) {
      return res.status(403).json({ error: 'Only room creator can delete room' });
    }

    // Soft delete - just deactivate
    room.isActive = false;
    await room.save();

    res.json({ message: 'Room deleted successfully' });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMyRooms = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get rooms created by user
    const createdRooms = await Room.find({
      createdBy: userId,
      isActive: true
    })
    .populate('participantIds', 'name photoURL')
    .sort({ createdAt: -1 });

    // Get rooms user is participating in
    const participatingRooms = await Room.find({
      participantIds: userId,
      createdBy: { $ne: userId },
      isActive: true
    })
    .populate('createdBy', 'name photoURL')
    .populate('participantIds', 'name photoURL')
    .sort({ createdAt: -1 });

    res.json({
      message: 'User rooms retrieved successfully',
      createdRooms: createdRooms.map(room => ({
        ...room.toObject(),
        participantCount: room.participantIds.length,
        spotsAvailable: room.maxParticipants - room.participantIds.length
      })),
      participatingRooms: participatingRooms.map(room => ({
        ...room.toObject(),
        participantCount: room.participantIds.length,
        spotsAvailable: room.maxParticipants - room.participantIds.length
      }))
    });
  } catch (error) {
    console.error('Get my rooms error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
