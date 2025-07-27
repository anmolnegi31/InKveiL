import { Response } from 'express';
import Message from '../models/Message';
import Connection from '../models/Connection';
import User from '../models/User';
import Notification from '../models/Notification';
import { AuthenticatedRequest } from '../middleware/auth';
import { SendMessageRequest, GetMessagesQuery, MarkAsReadRequest } from '../schemas/message';

export const sendMessage = async (req: AuthenticatedRequest<{ connectionId: string }, {}, SendMessageRequest>, res: Response) => {
  try {
    const { connectionId } = req.params;
    const { content, isMedia, mediaURL, mediaType } = req.body;
    const senderId = req.user!.userId;

    // Find and validate connection
    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Check if user is part of this connection
    const isParticipant = connection.requesterId.toString() === senderId || 
                         connection.receiverId.toString() === senderId;
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to send messages in this connection' });
    }

    // Check if connection is accepted
    if (connection.status !== 'accepted') {
      return res.status(400).json({ error: 'Connection must be accepted to send messages' });
    }

    // Check if chat window is still active (24 hours)
    if (!connection.chatExpiresAt || connection.chatExpiresAt < new Date()) {
      return res.status(400).json({ error: 'Chat window has expired' });
    }

    // Determine receiver
    const receiverId = connection.requesterId.toString() === senderId ? 
                      connection.receiverId.toString() : 
                      connection.requesterId.toString();

    // Create message
    const message = new Message({
      senderId,
      receiverId,
      connectionId,
      content,
      isMedia: isMedia || false,
      mediaURL,
      mediaType,
      isEncrypted: true // In production, implement actual encryption
    });

    await message.save();

    // Create notification for receiver
    const sender = await User.findById(senderId).select('name');
    const notification = new Notification({
      userId: receiverId,
      type: 'new_message',
      title: 'New Message',
      message: `${sender?.name} sent you a message`,
      data: { connectionId, messageId: message._id }
    });

    await notification.save();

    // Populate sender info for response
    await message.populate('senderId', 'name photoURL');

    res.status(201).json({
      message: 'Message sent successfully',
      messageData: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getMessages = async (req: AuthenticatedRequest<{ connectionId: string }, {}, {}, GetMessagesQuery>, res: Response) => {
  try {
    const { connectionId } = req.params;
    const { page = 1, limit = 50, before, after } = req.query;
    const userId = req.user!.userId;

    // Find and validate connection
    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Check if user is part of this connection
    const isParticipant = connection.requesterId.toString() === userId || 
                         connection.receiverId.toString() === userId;
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to view messages in this connection' });
    }

    // Build query filters
    const filters: any = {
      connectionId,
      isDeleted: false
    };

    // Add pagination filters
    if (before) {
      const beforeMessage = await Message.findById(before);
      if (beforeMessage) {
        filters.timestamp = { $lt: beforeMessage.timestamp };
      }
    }

    if (after) {
      const afterMessage = await Message.findById(after);
      if (afterMessage) {
        filters.timestamp = { $gt: afterMessage.timestamp };
      }
    }

    const skip = (page - 1) * limit;

    // Get messages
    const messages = await Message.find(filters)
      .populate('senderId', 'name photoURL')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    // Reverse to show oldest first
    messages.reverse();

    // Get unread count for current user
    const unreadCount = await Message.countDocuments({
      connectionId,
      receiverId: userId,
      isRead: false,
      isDeleted: false
    });

    // Calculate time left in chat window
    const timeLeft = connection.chatExpiresAt ? 
                    Math.max(0, connection.chatExpiresAt.getTime() - Date.now()) : 0;

    const totalMessages = await Message.countDocuments({
      connectionId,
      isDeleted: false
    });

    res.json({
      message: 'Messages retrieved successfully',
      messages,
      unreadCount,
      chatExpiresAt: connection.chatExpiresAt,
      timeLeft,
      timeLeftFormatted: formatTimeLeft(timeLeft),
      pagination: {
        currentPage: page,
        totalMessages,
        hasMore: totalMessages > skip + messages.length
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markAsRead = async (req: AuthenticatedRequest<{ connectionId: string }, {}, MarkAsReadRequest>, res: Response) => {
  try {
    const { connectionId } = req.params;
    const { messageIds } = req.body;
    const userId = req.user!.userId;

    // Validate connection
    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    // Check if user is part of this connection
    const isParticipant = connection.requesterId.toString() === userId || 
                         connection.receiverId.toString() === userId;
    if (!isParticipant) {
      return res.status(403).json({ error: 'Not authorized to mark messages as read in this connection' });
    }

    // Update messages as read
    const result = await Message.updateMany(
      {
        _id: { $in: messageIds },
        connectionId,
        receiverId: userId,
        isRead: false
      },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    );

    res.json({
      message: 'Messages marked as read',
      markedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteMessage = async (req: AuthenticatedRequest<{ messageId: string }>, res: Response) => {
  try {
    const { messageId } = req.params;
    const userId = req.user!.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Only sender can delete their own messages
    if (message.senderId.toString() !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    // Soft delete
    message.isDeleted = true;
    await message.save();

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getChatSummary = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get all active connections with message counts
    const activeConnections = await Connection.find({
      $or: [
        { requesterId: userId },
        { receiverId: userId }
      ],
      status: 'accepted',
      chatExpiresAt: { $gt: new Date() }
    })
    .populate([
      { path: 'requesterId', select: 'name photoURL lastActive' },
      { path: 'receiverId', select: 'name photoURL lastActive' }
    ]);

    const chatSummaries = await Promise.all(
      activeConnections.map(async (conn) => {
        const isRequester = conn.requesterId._id.toString() === userId;
        const otherUser = isRequester ? conn.receiverId : conn.requesterId;

        // Get unread count
        const unreadCount = await Message.countDocuments({
          connectionId: conn._id,
          receiverId: userId,
          isRead: false,
          isDeleted: false
        });

        // Get last message
        const lastMessage = await Message.findOne({
          connectionId: conn._id,
          isDeleted: false
        })
        .sort({ timestamp: -1 })
        .populate('senderId', 'name');

        const timeLeft = conn.chatExpiresAt ? 
                        Math.max(0, conn.chatExpiresAt.getTime() - Date.now()) : 0;

        return {
          connectionId: conn._id,
          otherUser,
          unreadCount,
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            timestamp: lastMessage.timestamp,
            senderName: lastMessage.senderId.name,
            isFromMe: lastMessage.senderId._id.toString() === userId
          } : null,
          chatExpiresAt: conn.chatExpiresAt,
          timeLeft,
          timeLeftFormatted: formatTimeLeft(timeLeft)
        };
      })
    );

    // Sort by most recent activity
    chatSummaries.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return b.lastMessage.timestamp.getTime() - a.lastMessage.timestamp.getTime();
    });

    res.json({
      message: 'Chat summary retrieved successfully',
      chats: chatSummaries,
      totalUnread: chatSummaries.reduce((sum, chat) => sum + chat.unreadCount, 0)
    });
  } catch (error) {
    console.error('Get chat summary error:', error);
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
