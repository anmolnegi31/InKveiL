import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IMessage extends Document {
  senderId: Types.ObjectId;
  receiverId: Types.ObjectId;
  connectionId: Types.ObjectId;
  content: string;
  isMedia: boolean;
  mediaURL?: string;
  mediaType?: 'image' | 'video' | 'audio' | 'file';
  timestamp: Date;
  isDeleted: boolean;
  isRead: boolean;
  readAt?: Date;
  isEncrypted: boolean;
}

const MessageSchema: Schema = new Schema({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  connectionId: {
    type: Schema.Types.ObjectId,
    ref: 'Connection',
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 1000
  },
  isMedia: {
    type: Boolean,
    default: false
  },
  mediaURL: {
    type: String,
    default: null
  },
  mediaType: {
    type: String,
    enum: ['image', 'video', 'audio', 'file'],
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  isEncrypted: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
MessageSchema.index({ connectionId: 1, timestamp: -1 });
MessageSchema.index({ senderId: 1, receiverId: 1, timestamp: -1 });
MessageSchema.index({ receiverId: 1, isRead: 1 });

export default mongoose.model<IMessage>('Message', MessageSchema);
