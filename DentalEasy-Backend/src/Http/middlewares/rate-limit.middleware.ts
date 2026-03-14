import rateLimit from 'express-rate-limit';
import { NextFunction, Request, Response } from 'express';
import { env } from '../../config/env';

const buildRateLimitExceededResponse = (_req: Request, res: Response): void => {
  res.status(429).json({
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Muitas tentativas. Tente novamente mais tarde.',
    },
  });
};

const buildLimiter = (windowMinutes: number, max: number) =>
  rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: buildRateLimitExceededResponse,
  });

export const authLoginRateLimit = buildLimiter(
  env.RATE_LIMIT_LOGIN_WINDOW_MINUTES,
  env.RATE_LIMIT_LOGIN_MAX_REQUESTS,
);

export const authRefreshRateLimit = buildLimiter(
  env.RATE_LIMIT_REFRESH_WINDOW_MINUTES,
  env.RATE_LIMIT_REFRESH_MAX_REQUESTS,
);

export const authForgotPasswordRateLimit = buildLimiter(
  env.RATE_LIMIT_FORGOT_WINDOW_MINUTES,
  env.RATE_LIMIT_FORGOT_MAX_REQUESTS,
);

export const authResetPasswordRateLimit = buildLimiter(
  env.RATE_LIMIT_RESET_WINDOW_MINUTES,
  env.RATE_LIMIT_RESET_MAX_REQUESTS,
);

interface DelayState {
  attempts: number;
  lastAttemptAt: number;
}

const loginDelayByAccountAndIp = new Map<string, DelayState>();
const delayEntryTtlMs = 30 * 60 * 1000;
const maxProgressiveDelayMs = 1500;
const delayStepMs = 250;

const normalizeEmail = (email: unknown): string | null => {
  if (typeof email !== 'string') {
    return null;
  }

  const normalized = email.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
};

const cleanupStaleEntries = (now: number): void => {
  for (const [key, value] of loginDelayByAccountAndIp.entries()) {
    if (now - value.lastAttemptAt > delayEntryTtlMs) {
      loginDelayByAccountAndIp.delete(key);
    }
  }
};

export const authLoginProgressiveDelay = (
  req: Request,
  _res: Response,
  next: NextFunction,
): void => {
  if (env.NODE_ENV === 'test') {
    next();
    return;
  }

  const email = normalizeEmail(req.body?.email);
  const key = `${req.ip}:${email ?? 'unknown-email'}`;
  const now = Date.now();
  const state = loginDelayByAccountAndIp.get(key) ?? { attempts: 0, lastAttemptAt: now };

  const nextAttempts = state.attempts + 1;
  loginDelayByAccountAndIp.set(key, {
    attempts: nextAttempts,
    lastAttemptAt: now,
  });

  cleanupStaleEntries(now);

  const delayMs = Math.min((nextAttempts - 1) * delayStepMs, maxProgressiveDelayMs);
  if (delayMs <= 0) {
    next();
    return;
  }

  setTimeout(() => next(), delayMs);
};
