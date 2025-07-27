import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ISubscription extends Document {
  userId: Types.ObjectId;
  type: 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  paymentDetails: {
    paymentId: string;
    amount: number;
    currency: string;
    provider: string;
  };
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  type: {
    type: String,
    required: true,
    enum: ['monthly', 'yearly']
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'cancelled', 'expired', 'pending'],
    default: 'pending'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  paymentDetails: {
    paymentId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'USD' },
    provider: { type: String, required: true }
  },
  features: [{
    type: String,
    enum: ['rooms', 'profile_boost', 'advanced_filters', 'read_receipts', 'unlimited_requests']
  }]
}, {
  timestamps: true
});

// Indexes
SubscriptionSchema.index({ userId: 1 });
SubscriptionSchema.index({ status: 1, endDate: 1 });

export default mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
