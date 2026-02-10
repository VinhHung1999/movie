import jwt from 'jsonwebtoken';
import { config } from '../config';
import { TokenPayload, RefreshTokenPayload } from '../types';

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign({ ...payload }, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn as unknown as jwt.SignOptions['expiresIn'],
  });
}

export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign({ ...payload }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as unknown as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwt.accessSecret) as TokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, config.jwt.refreshSecret) as RefreshTokenPayload;
}
