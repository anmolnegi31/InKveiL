import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

export const connectDB = async () => {
  // If no MongoDB URI is provided, skip database connection for demo mode
  if (!MONGODB_URI || MONGODB_URI.trim() === '') {
    console.log('🚀 Running in demo mode without database connection');
    console.log('💡 To connect to MongoDB, set the MONGODB_URI environment variable');
    console.log('   Example: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/inkveil');
    return null;
  }

  try {
    const conn = await mongoose.connect(MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ Error connecting to MongoDB:', error);
    console.log('🚀 Server will continue without database connection...');
    console.log('💡 Please check your MONGODB_URI environment variable.');
    return null;
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('MongoDB Disconnected');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
};
