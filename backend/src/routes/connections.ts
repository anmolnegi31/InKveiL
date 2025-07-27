import { Response } from 'express';
import Connection from '../models/Connection';
import User from '../models/User';
import Notification from '../models/Notification';
import { AuthenticatedRequest } from '../middleware/auth';
import { CreateConnectionRequestRequest, UpdateConnectionStatusRequest, GetConnectionsQuery } from '../schemas/connection';

export const createConnectionRequest = async (req: AuthenticatedRequest<{}, {}, CreateConnectionRequestRequest>, res: Response) => {
  try {
    const { receiverId, message } = req.body;
    const requesterId = req.user!.userId;

    // Check if trying to connect with self
    if (requesterId === receiverId) {
      return res.status(400).json({ error: 'Cannot send connection request to yourself' });
    }

    // Check if receiver exists
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if connection already exists
    const existingConnection = await Connection.findOne({
      $or: [
        { requesterId, receiverId },
        { requesterId: receiverId, receiverId: requesterId }
      ]
    });

    if (existingConnection) {
      return res.status(409).json({ 
        error: 'Connection already exists',
        status: existingConnection.status
      });
    }

    // Create connection request
    const connection = new Connection({
      requesterId,
      receiverId,
      message,
      status: 'pending'
    });

    await connection.save();

    // Create notification for receiver
    const requester = await User.findById(requesterId).select('name');
    const notification = new Notification({
      userId: receiverId,
      type: 'connection_request',
      title: 'New Connection Request',
      message: `${requester?.name} wants to connect with you`,
      data: { connectionId: connection._id, requesterId }
    });

    await notification.save();

    // Populate the connection data for response
    await connection.populate([
      { path: 'requesterId', select: 'name age gender location.city bio photoURL' },
      { path: 'receiverId', select: 'name age gender location.city bio photoURL' }
    ]);

    res.status(201).json({
      message: 'Connection request sent successfully',
      connection
    });
  } catch (error) {
    console.error('Create connection request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getConnections = async (req: AuthenticatedRequest<{}, {}, {}, GetConnectionsQuery>, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { 
      status,
      type = 'all',
      page = 1,
      limit = 20
    } = req.query;

    // Build query filters
    let filters: any = {};

    if (type === 'sent') {
      filters.requesterId = userId;
    } else if (type === 'received') {
      filters.receiverId = userId;
    } else {
      filters.$or = [
        { requesterId: userId },
        { receiverId: userId }
      ];
    }

    if (status) {
      filters.status = status;
    }

    const skip = (page - 1) * limit;

    // Get connections with populated user data
    const connections = await Connection.find(filters)
      .populate([
        { path: 'requesterId', select: 'name age gender location.city bio photoURL lastActive' },
        { path: 'receiverId', select: 'name age gender location.city bio photoURL lastActive' }
      ])
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    // Format connections for response
    const formattedConnections = connections.map(conn => {
      const isRequester = conn.requesterId._id.toString() === userId;
      const otherUser = isRequester ? conn.receiverId : conn.requesterId;
      
      return {
        _id: conn._id,
        otherUser,
        status: conn.status,
        message: conn.message,
        timestamp: conn.timestamp,
        expiresAt: conn.expiresAt,
        chatExpiresAt: conn.chatExpiresAt,
        isRequester,
        timeLeft: conn.chatExpiresAt ? Math.max(0, conn.chatExpiresAt.getTime() - Date.now()) : null
      };
    });

    const totalConnections = await Connection.countDocuments(filters);
    const totalPages = Math.ceil(totalConnections / limit);

    res.json({
      message: 'Connections retrieved successfully',
      connections: formattedConnections,
      pagination: {
        currentPage: page,
        totalPages,
        totalConnections,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateConnectionStatus = async (req: AuthenticatedRequest<{ connectionId: string }, {}, UpdateConnectionStatusRequest>, res: Response) => {
  try {
    const { connectionId } = req.params;
    const { status } = req.body;
    const userId = req.user!.userId;

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Only the receiver can update the connection status
    if (connection.receiverId.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this connection' });
    }

    // Check if connection is still pending
    if (connection.status !== 'pending') {
      return res.status(400).json({ error: 'Connection request is no longer pending' });
    }

    // Check if connection has expired
    if (connection.expiresAt && connection.expiresAt < new Date()) {
      connection.status = 'expired';
      await connection.save();
      return res.status(400).json({ error: 'Connection request has expired' });
    }

    // Update connection status
    connection.status = status;
    
    // If accepted, set chat expiration to 24 hours from now
    if (status === 'accepted') {
      connection.chatExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    }

    await connection.save();

    // Create notification for requester
    if (status === 'accepted') {
      const receiver = await User.findById(userId).select('name');
      const notification = new Notification({
        userId: connection.requesterId,
        type: 'connection_accepted',
        title: 'Connection Accepted!',
        message: `${receiver?.name} accepted your connection request. You have 24 hours to start chatting!`,
        data: { connectionId: connection._id }
      });
      await notification.save();
    }

    // Populate connection data for response
    await connection.populate([
      { path: 'requesterId', select: 'name age gender location.city bio photoURL' },
      { path: 'receiverId', select: 'name age gender location.city bio photoURL' }
    ]);

    res.json({
      message: `Connection ${status} successfully`,
      connection
    });
  } catch (error) {
    console.error('Update connection status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getActiveChats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get all accepted connections where chat hasn't expired
    const activeConnections = await Connection.find({
      $or: [
        { requesterId: userId },
        { receiverId: userId }
      ],
      status: 'accepted',
      chatExpiresAt: { $gt: new Date() }
    })
    .populate([
      { path: 'requesterId', select: 'name age gender location.city photoURL lastActive' },
      { path: 'receiverId', select: 'name age gender location.city photoURL lastActive' }
    ])
    .sort({ chatExpiresAt: 1 });

    // Format for response
    const activeChats = activeConnections.map(conn => {
      const isRequester = conn.requesterId._id.toString() === userId;
      const otherUser = isRequester ? conn.receiverId : conn.requesterId;
      const timeLeft = conn.chatExpiresAt ? Math.max(0, conn.chatExpiresAt.getTime() - Date.now()) : 0;
      
      return {
        connectionId: conn._id,
        otherUser,
        chatExpiresAt: conn.chatExpiresAt,
        timeLeft,
        timeLeftFormatted: formatTimeLeft(timeLeft)
      };
    });

    res.json({
      message: 'Active chats retrieved successfully',
      activeChats,
      count: activeChats.length
    });
  } catch (error) {
    console.error('Get active chats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteConnection = async (req: AuthenticatedRequest<{ connectionId: string }>, res: Response) => {
  try {
    const { connectionId } = req.params;
    const userId = req.user!.userId;

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Only participants can delete the connection
    if (connection.requesterId.toString() !== userId && connection.receiverId.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this connection' });
    }

    await Connection.findByIdAndDelete(connectionId);

    res.json({ message: 'Connection deleted successfully' });
  } catch (error) {
    console.error('Delete connection error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to format time left
function formatTimeLeft(milliseconds: number): string {
  const hours = Math.floor(milliseconds / (1000 * 60 * 60));
  const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return 'Expired';
  }
}
