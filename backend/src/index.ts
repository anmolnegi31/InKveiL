import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/database';
import { authenticateToken, requirePremium } from './middleware/auth';
import { validateBody, validateQuery } from './middleware/validation';
import { requireDatabase, optionalDatabase } from './middleware/database';

// Load environment variables
dotenv.config();

// Import validation schemas
import { 
  SignupSchema, 
  LoginSchema, 
  RefreshTokenSchema, 
  ForgotPasswordSchema, 
  ResetPasswordSchema 
} from './schemas/auth';
import { 
  UpdateProfileSchema, 
  UpdatePreferencesSchema, 
  DiscoverUsersSchema 
} from './schemas/user';
import { 
  CreateConnectionRequestSchema, 
  UpdateConnectionStatusSchema, 
  GetConnectionsSchema 
} from './schemas/connection';
import { 
  SendMessageSchema, 
  GetMessagesSchema, 
  MarkAsReadSchema 
} from './schemas/message';
import { 
  CreateRoomSchema, 
  GetRoomsSchema, 
  UpdateRoomSchema 
} from './schemas/room';

// Import route handlers
import * as authRoutes from './routes/auth';
import * as userRoutes from './routes/users';
import * as connectionRoutes from './routes/connections';
import * as messageRoutes from './routes/messages';
import * as roomRoutes from './routes/rooms';

// Example demo route (from original)
import { handleDemo } from './routes/demo';

export const createServer = async () => {
  const app = express();

  // Connect to MongoDB (gracefully handle failures)
  const dbConnection = await connectDB();
  if (dbConnection) {
    console.log('✅ Database connected successfully');
  } else {
    console.log('⚠️  Database connection failed - API routes requiring DB will not work');
  }

  // Security middleware
  app.use(helmet());
 app.use(cors({
  origin:['http://localhost:3000', 'http://localhost:8080'],
  credentials: true
}));


  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });
  app.use('/api/', limiter);

  // Stricter rate limiting for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 auth requests per windowMs
    message: 'Too many authentication attempts, please try again later.'
  });

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/api/health', optionalDatabase, (req, res) => {
    const dbStatus = (req as any).dbAvailable ? 'connected' : 'disconnected';
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'InKveiL API',
      database: dbStatus,
      demo: !!(req as any).dbAvailable === false
    });
  });

  // Legacy demo routes (keep for compatibility)
  app.get('/api/ping', (req, res) => {
    res.json({ message: 'pong' });
  });
  app.get('/api/demo', handleDemo);

  // Authentication routes
  app.post('/api/auth/signup', authLimiter, requireDatabase, validateBody(SignupSchema), authRoutes.signup);
  app.post('/api/auth/login', authLimiter, requireDatabase, validateBody(LoginSchema), authRoutes.login);
  app.post('/api/auth/refresh', requireDatabase, validateBody(RefreshTokenSchema), authRoutes.refreshToken);
  app.post('/api/auth/logout', authenticateToken, authRoutes.logout);
  app.post('/api/auth/forgot-password', authLimiter, requireDatabase, validateBody(ForgotPasswordSchema), authRoutes.forgotPassword);
  app.post('/api/auth/reset-password', authLimiter, requireDatabase, validateBody(ResetPasswordSchema), authRoutes.resetPassword);

  // User profile routes
  app.get('/api/users/profile', authenticateToken, userRoutes.getProfile);
  app.put('/api/users/profile', authenticateToken, validateBody(UpdateProfileSchema), userRoutes.updateProfile);
  app.put('/api/users/preferences', authenticateToken, validateBody(UpdatePreferencesSchema), userRoutes.updatePreferences);
  app.get('/api/users/discover', authenticateToken, validateQuery(DiscoverUsersSchema), userRoutes.discoverUsers);
  app.get('/api/users/:userId', authenticateToken, userRoutes.getUserById);
  app.delete('/api/users/profile', authenticateToken, userRoutes.deleteProfile);

  // Connection routes
  app.post('/api/connections/request', authenticateToken, validateBody(CreateConnectionRequestSchema), connectionRoutes.createConnectionRequest);
  app.get('/api/connections', authenticateToken, validateQuery(GetConnectionsSchema), connectionRoutes.getConnections);
  app.put('/api/connections/:connectionId/status', authenticateToken, validateBody(UpdateConnectionStatusSchema), connectionRoutes.updateConnectionStatus);
  app.get('/api/connections/active-chats', authenticateToken, connectionRoutes.getActiveChats);
  app.delete('/api/connections/:connectionId', authenticateToken, connectionRoutes.deleteConnection);

  // Messaging routes
  app.post('/api/messages/:connectionId', authenticateToken, validateBody(SendMessageSchema), messageRoutes.sendMessage);
  app.get('/api/messages/:connectionId', authenticateToken, validateQuery(GetMessagesSchema), messageRoutes.getMessages);
  app.put('/api/messages/:connectionId/read', authenticateToken, validateBody(MarkAsReadSchema), messageRoutes.markAsRead);
  app.delete('/api/messages/:messageId', authenticateToken, messageRoutes.deleteMessage);
  app.get('/api/messages/chat-summary', authenticateToken, messageRoutes.getChatSummary);

  // Premium room routes (require premium subscription)
  app.post('/api/rooms', authenticateToken, requirePremium, validateBody(CreateRoomSchema), roomRoutes.createRoom);
  app.get('/api/rooms', authenticateToken, requirePremium, validateQuery(GetRoomsSchema), roomRoutes.getRooms);
  app.get('/api/rooms/my-rooms', authenticateToken, requirePremium, roomRoutes.getMyRooms);
  app.get('/api/rooms/:roomId', authenticateToken, requirePremium, roomRoutes.getRoomById);
  app.post('/api/rooms/:roomId/join', authenticateToken, requirePremium, roomRoutes.joinRoom);
  app.post('/api/rooms/:roomId/leave', authenticateToken, requirePremium, roomRoutes.leaveRoom);
  app.put('/api/rooms/:roomId', authenticateToken, requirePremium, validateBody(UpdateRoomSchema), roomRoutes.updateRoom);
  app.delete('/api/rooms/:roomId', authenticateToken, requirePremium, roomRoutes.deleteRoom);

  // Error handling middleware
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Error:', err);
    
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation error', details: err.message });
    }
    
    if (err.name === 'CastError') {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Duplicate key error' });
    }
    
    res.status(500).json({ error: 'Internal server error' });
  });

  // 404 handler for API routes only
  app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'API route not found' });
  });

  return app;
};

// For development and serverless deployment
if (require.main === module) {
  const { createServer } = require('./index');  
  const PORT = process.env.PORT || 8080;
  
  createServer().then((app: { listen: (arg0: string | number, arg1: () => void) => void; }) => {
    app.listen(PORT, () => {
      console.log(`🚀 InKveiL API Server running on port ${PORT}`);
      console.log(`📚 API Documentation available at http://localhost:${PORT}/api/health`);
    });
  }).catch(console.error);
}
