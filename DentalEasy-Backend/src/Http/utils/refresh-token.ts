import { Request, Response } from 'express';
import { env } from '../../config/env';

const parseCookies = (headerValue: string | undefined): Record<string, string> => {
  if (!headerValue) {
    return {};
  }

  return headerValue.split(';').reduce<Record<string, string>>((accumulator, cookiePart) => {
    const separatorIndex = cookiePart.indexOf('=');
    if (separatorIndex <= 0) {
      return accumulator;
    }

    const key = cookiePart.slice(0, separatorIndex).trim();
    const value = decodeURIComponent(cookiePart.slice(separatorIndex + 1).trim());
    accumulator[key] = value;
    return accumulator;
  }, {});
};

export const extractRefreshTokenFromRequest = (
  req: Request,
  bodyRefreshToken?: string,
): string | null => {
  const cookieToken = parseCookies(req.header('cookie'))[env.AUTH_REFRESH_COOKIE_NAME];
  if (cookieToken) {
    return cookieToken;
  }

  if (bodyRefreshToken && bodyRefreshToken.trim().length > 0) {
    return bodyRefreshToken.trim();
  }

  return null;
};

export const setRefreshTokenCookie = (res: Response, refreshToken: string): void => {
  if (!env.AUTH_REFRESH_COOKIE_ENABLED) {
    return;
  }

  res.cookie(env.AUTH_REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: env.AUTH_REFRESH_COOKIE_SECURE,
    sameSite: env.AUTH_REFRESH_COOKIE_SAMESITE,
    path: '/api/auth',
    domain: env.AUTH_REFRESH_COOKIE_DOMAIN,
    maxAge: env.JWT_REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  });
};

export const clearRefreshTokenCookie = (res: Response): void => {
  if (!env.AUTH_REFRESH_COOKIE_ENABLED) {
    return;
  }

  res.clearCookie(env.AUTH_REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.AUTH_REFRESH_COOKIE_SECURE,
    sameSite: env.AUTH_REFRESH_COOKIE_SAMESITE,
    path: '/api/auth',
    domain: env.AUTH_REFRESH_COOKIE_DOMAIN,
  });
};
