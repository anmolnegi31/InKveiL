import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IReport extends Document {
  reportedBy: Types.ObjectId;
  reportedUser: Types.ObjectId;
  reportedContent?: Types.ObjectId;
  contentType?: 'message' | 'profile' | 'room';
  reason: 'harassment' | 'inappropriate_content' | 'spam' | 'fake_profile' | 'underage' | 'other';
  description: string;
  evidence?: string[];
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  adminNotes?: string;
  actionTaken?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema: Schema = new Schema({
  reportedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedUser: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedContent: {
    type: Schema.Types.ObjectId,
    default: null
  },
  contentType: {
    type: String,
    enum: ['message', 'profile', 'room'],
    default: null
  },
  reason: {
    type: String,
    required: true,
    enum: ['harassment', 'inappropriate_content', 'spam', 'fake_profile', 'underage', 'other']
  },
  description: {
    type: String,
    required: true,
    maxlength: 1000
  },
  evidence: [{
    type: String
  }],
  status: {
    type: String,
    required: true,
    enum: ['pending', 'investigating', 'resolved', 'dismissed'],
    default: 'pending'
  },
  adminNotes: {
    type: String,
    maxlength: 1000,
    default: ''
  },
  actionTaken: {
    type: String,
    maxlength: 500,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes
ReportSchema.index({ reportedUser: 1, status: 1 });
ReportSchema.index({ reportedBy: 1 });
ReportSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model<IReport>('Report', ReportSchema);
