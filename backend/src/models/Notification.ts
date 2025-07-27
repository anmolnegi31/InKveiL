import mongoose, { Document, Schema, Types } from 'mongoose';

export interface INotification extends Document {
  userId: Types.ObjectId;
  type: 'connection_request' | 'connection_accepted' | 'new_message' | 'room_invitation' | 'subscription_expiry' | 'system';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  readAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['connection_request', 'connection_accepted', 'new_message', 'room_invitation', 'subscription_expiry', 'system']
  },
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  message: {
    type: String,
    required: true,
    maxlength: 300
  },
  data: {
    type: Schema.Types.Mixed,
    default: null
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  }
}, {
  timestamps: true
});

// Indexes
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
