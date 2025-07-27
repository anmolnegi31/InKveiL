import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'inkveil_secret_key_change_in_production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'inkveil_refresh_secret_key_change_in_production';

export interface JWTPayload {
  userId: string;
  email: string;
  isPremium: boolean;
}

export const generateTokens = (payload: JWTPayload) => {
  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
  
  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_REFRESH_SECRET) as JWTPayload;
};

export const refreshAccessToken = (refreshToken: string) => {
  try {
    const payload = verifyRefreshToken(refreshToken);
    const newTokens = generateTokens(payload);
    return newTokens;
  } catch (error) {
    throw new Error('Invalid refresh token');
  }
};
