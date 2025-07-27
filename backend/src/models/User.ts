import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password: string;
  gender: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
  age: number;
  location: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  };
  isPremium: boolean;
  bio: string;
  interests: string[];
  photoURL?: string;
  isAnonymous: boolean;
  authType: 'email' | 'google' | 'phone';
  intent: 'dating' | 'friendship' | 'both';
  preferences: {
    ageRange: {
      min: number;
      max: number;
    };
    maxDistance: number;
    genderPreference: 'male' | 'female' | 'both' | 'non-binary';
    intentPreference: 'dating' | 'friendship' | 'both';
  };
  isVerified: boolean;
  lastActive: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  gender: {
    type: String,
    required: true,
    enum: ['male', 'female', 'non-binary', 'prefer-not-to-say']
  },
  age: {
    type: Number,
    required: true,
    min: 18,
    max: 100
  },
  location: {
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true }
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  interests: [{
    type: String,
    trim: true
  }],
  photoURL: {
    type: String,
    default: null
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  authType: {
    type: String,
    required: true,
    enum: ['email', 'google', 'phone']
  },
  intent: {
    type: String,
    required: true,
    enum: ['dating', 'friendship', 'both']
  },
  preferences: {
    ageRange: {
      min: { type: Number, default: 18 },
      max: { type: Number, default: 35 }
    },
    maxDistance: { type: Number, default: 50 },
    genderPreference: {
      type: String,
      enum: ['male', 'female', 'both', 'non-binary'],
      default: 'both'
    },
    intentPreference: {
      type: String,
      enum: ['dating', 'friendship', 'both'],
      default: 'both'
    }
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for geospatial queries
UserSchema.index({ 'location.latitude': 1, 'location.longitude': 1 });

// Index for search optimization
UserSchema.index({ age: 1, gender: 1, intent: 1 });

export default mongoose.model<IUser>('User', UserSchema);
