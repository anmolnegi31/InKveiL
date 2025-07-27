import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { generateTokens, refreshAccessToken } from '../utils/jwt';
import { 
  SignupRequest, 
  LoginRequest, 
  RefreshTokenRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest 
} from '../schemas/auth';

export const signup = async (req: Request<{}, {}, SignupRequest>, res: Response) => {
  try {
    const { email, password, ...userData } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new User({
      ...userData,
      email,
      password: hashedPassword,
      preferences: userData.preferences || {
        ageRange: { min: 18, max: 35 },
        maxDistance: 50,
        genderPreference: 'both',
        intentPreference: 'both'
      }
    });

    await user.save();

    // Generate tokens
    const tokens = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      isPremium: user.isPremium
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse,
      ...tokens
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const login = async (req: Request<{}, {}, LoginRequest>, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Update last active
    user.lastActive = new Date();
    await user.save();

    // Generate tokens
    const tokens = generateTokens({
      userId: user._id.toString(),
      email: user.email,
      isPremium: user.isPremium
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      message: 'Login successful',
      user: userResponse,
      ...tokens
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const refreshToken = async (req: Request<{}, {}, RefreshTokenRequest>, res: Response) => {
  try {
    const { refreshToken: token } = req.body;

    const tokens = refreshAccessToken(token);

    res.json({
      message: 'Token refreshed successfully',
      ...tokens
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

export const logout = async (req: Request, res: Response) => {
  // In a production app, you might want to blacklist the token
  // For now, we'll just send a success response
  res.json({ message: 'Logout successful' });
};

export const forgotPassword = async (req: Request<{}, {}, ForgotPasswordRequest>, res: Response) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }

    // In a real app, you would:
    // 1. Generate a secure reset token
    // 2. Store it in the database with expiration
    // 3. Send an email with the reset link
    
    // For now, just return success
    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resetPassword = async (req: Request<{}, {}, ResetPasswordRequest>, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    // In a real app, you would:
    // 1. Verify the reset token from the database
    // 2. Check if it's not expired
    // 3. Update the user's password

    // For now, just return success (implement token verification in production)
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
