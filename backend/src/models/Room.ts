import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IRoom extends Document {
  roomName: string;
  description: string;
  createdBy: Types.ObjectId;
  participantIds: Types.ObjectId[];
  maxParticipants: number;
  roomType: 'discussion' | 'event' | 'meetup' | 'hobby';
  tags: string[];
  isPrivate: boolean;
  subscriptionRequired: boolean;
  scheduledFor?: Date;
  duration?: number; // in minutes
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoomSchema: Schema = new Schema({
  roomName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    maxlength: 500
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  participantIds: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  maxParticipants: {
    type: Number,
    default: 5,
    min: 2,
    max: 10
  },
  roomType: {
    type: String,
    required: true,
    enum: ['discussion', 'event', 'meetup', 'hobby']
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPrivate: {
    type: Boolean,
    default: false
  },
  subscriptionRequired: {
    type: Boolean,
    default: true
  },
  scheduledFor: {
    type: Date,
    default: null
  },
  duration: {
    type: Number,
    default: 60 // 60 minutes default
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
RoomSchema.index({ createdBy: 1 });
RoomSchema.index({ roomType: 1, isActive: 1 });
RoomSchema.index({ tags: 1 });
RoomSchema.index({ scheduledFor: 1 });

export default mongoose.model<IRoom>('Room', RoomSchema);
