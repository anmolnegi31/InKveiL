import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IConnection extends Document {
  requesterId: Types.ObjectId;
  receiverId: Types.ObjectId;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  message?: string;
  timestamp: Date;
  expiresAt?: Date;
  chatExpiresAt?: Date;
  isActive: boolean;
}

const ConnectionSchema: Schema = new Schema({
  requesterId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'accepted', 'rejected', 'expired'],
    default: 'pending'
  },
  message: {
    type: String,
    maxlength: 300,
    default: ''
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  },
  chatExpiresAt: {
    type: Date,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate connection requests
ConnectionSchema.index({ requesterId: 1, receiverId: 1 }, { unique: true });

// Index for efficient queries
ConnectionSchema.index({ receiverId: 1, status: 1 });
ConnectionSchema.index({ requesterId: 1, status: 1 });
ConnectionSchema.index({ expiresAt: 1 });
ConnectionSchema.index({ chatExpiresAt: 1 });

// Middleware to set chat expiration when status changes to accepted
ConnectionSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'accepted' && !this.chatExpiresAt) {
    this.chatExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
  }
  next();
});

export default mongoose.model<IConnection>('Connection', ConnectionSchema);
