import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env';
import { AuthenticationError } from './errors';
import { UserRole } from './types';

const accessTokenPayloadSchema = z.object({
  sub: z.string().uuid(),
  organizationId: z.string().uuid(),
  role: z.enum(['ADMIN', 'SECRETARY', 'DENTIST']),
});

export interface AccessTokenPayload {
  sub: string;
  organizationId: string;
  role: UserRole;
}

export const signAccessToken = (payload: AccessTokenPayload): string => {
  const signOptions: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    subject: payload.sub,
  };

  return jwt.sign(
    {
      organizationId: payload.organizationId,
      role: payload.role,
    },
    env.JWT_SECRET,
    signOptions,
  );
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    const parsed = accessTokenPayloadSchema.parse({
      sub: decoded.sub,
      organizationId: decoded.organizationId,
      role: decoded.role,
    });

    return parsed;
  } catch {
    throw new AuthenticationError('Token invalido ou expirado.');
  }
};
