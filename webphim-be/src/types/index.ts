import { Request } from 'express';

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  avatar: string | null;
  createdAt: Date;
}

export interface TokenPayload {
  userId: string;
  email: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export interface AuthResult {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}
