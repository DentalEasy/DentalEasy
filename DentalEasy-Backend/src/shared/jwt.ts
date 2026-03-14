import crypto from 'crypto';
import jwt, { JwtPayload, SignOptions, VerifyOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env';
import { AuthenticationError } from './errors';
import { UserRole } from './types';

const baseTokenPayloadSchema = z.object({
  sub: z.string().uuid(),
  organizationId: z.string().uuid(),
  role: z.enum(['ADMIN', 'SECRETARY', 'DENTIST']),
  sid: z.string().uuid(),
  jti: z.string().uuid(),
  type: z.enum(['access', 'refresh']),
});

const accessTokenPayloadSchema = baseTokenPayloadSchema.extend({
  type: z.literal('access'),
});

const refreshTokenPayloadSchema = baseTokenPayloadSchema.extend({
  type: z.literal('refresh'),
  tokenFamilyId: z.string().uuid(),
});

interface JwtIdentityClaims {
  sub: string;
  organizationId: string;
  role: UserRole;
  sessionId: string;
}

export interface AccessTokenPayload {
  sub: string;
  organizationId: string;
  role: UserRole;
  sid: string;
  jti: string;
  type: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  organizationId: string;
  role: UserRole;
  sid: string;
  jti: string;
  tokenFamilyId: string;
  type: 'refresh';
}

const resolveSigningOptions = (
  subject: string,
  jwtId: string,
  expiresIn: SignOptions['expiresIn'],
): SignOptions => {
  const options: SignOptions = {
    expiresIn,
    subject,
    jwtid: jwtId,
  };

  if (env.JWT_ISSUER) {
    options.issuer = env.JWT_ISSUER;
  }
  if (env.JWT_AUDIENCE) {
    options.audience = env.JWT_AUDIENCE;
  }

  return options;
};

const resolveVerifyOptions = (): VerifyOptions => {
  const options: VerifyOptions = {};

  if (env.JWT_ISSUER) {
    options.issuer = env.JWT_ISSUER;
  }
  if (env.JWT_AUDIENCE) {
    options.audience = env.JWT_AUDIENCE;
  }

  return options;
};

const signToken = (
  secret: string,
  identity: JwtIdentityClaims,
  type: 'access' | 'refresh',
  expiresIn: SignOptions['expiresIn'],
  tokenFamilyId?: string,
): string => {
  const tokenId = crypto.randomUUID();
  const payload = {
    organizationId: identity.organizationId,
    role: identity.role,
    sid: identity.sessionId,
    type,
    tokenFamilyId,
  };

  return jwt.sign(
    payload,
    secret,
    resolveSigningOptions(identity.sub, tokenId, expiresIn),
  );
};

const verifyTokenPayload = <TPayload>(
  token: string,
  secret: string,
  schema: z.ZodSchema<TPayload>,
): TPayload => {
  try {
    const decoded = jwt.verify(token, secret, resolveVerifyOptions()) as JwtPayload;
    const parsed = schema.parse({
      sub: decoded.sub,
      organizationId: decoded.organizationId,
      role: decoded.role,
      sid: decoded.sid,
      jti: decoded.jti,
      type: decoded.type,
      tokenFamilyId: decoded.tokenFamilyId,
    });

    return parsed;
  } catch {
    throw new AuthenticationError('Token invalido ou expirado.');
  }
};

export const signAccessToken = (payload: JwtIdentityClaims): string =>
  signToken(
    env.JWT_SECRET,
    payload,
    'access',
    env.JWT_ACCESS_TOKEN_EXPIRES_IN as SignOptions['expiresIn'],
  );

export const signRefreshToken = (
  payload: JwtIdentityClaims & { tokenFamilyId: string },
): string =>
  signToken(
    env.JWT_REFRESH_SECRET,
    payload,
    'refresh',
    env.JWT_REFRESH_TOKEN_EXPIRES_IN as SignOptions['expiresIn'],
    payload.tokenFamilyId,
  );

export const verifyAccessToken = (token: string): AccessTokenPayload =>
  verifyTokenPayload(token, env.JWT_SECRET, accessTokenPayloadSchema);

export const verifyRefreshToken = (token: string): RefreshTokenPayload =>
  verifyTokenPayload(token, env.JWT_REFRESH_SECRET, refreshTokenPayloadSchema);
