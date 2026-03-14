import { Router } from 'express';
import {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenSchema,
  resetPasswordSchema,
  revokeSessionSchema,
} from '../../Application/DTOs';
import { env } from '../../config/env';
import { container } from '../../container';
import { AuthenticationError } from '../../shared/errors';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  authForgotPasswordRateLimit,
  authLoginProgressiveDelay,
  authLoginRateLimit,
  authRefreshRateLimit,
  authResetPasswordRateLimit,
} from '../middlewares/rate-limit.middleware';
import {
  clearRefreshTokenCookie,
  extractRefreshTokenFromRequest,
  setRefreshTokenCookie,
} from '../utils/refresh-token';
import { getUserContext } from '../utils/user-context';

const router = Router();

const getSessionRequestMetadata = (req: {
  ip?: string;
  headers: Record<string, string | string[] | undefined>;
}) => ({
  ipAddress: req.ip,
  userAgent:
    typeof req.headers['user-agent'] === 'string'
      ? req.headers['user-agent']
      : undefined,
  deviceName:
    typeof req.headers['x-device-name'] === 'string'
      ? req.headers['x-device-name']
      : undefined,
});

const sanitizeAuthResponse = <T extends { refreshToken?: string }>(
  payload: T,
): T | Omit<T, 'refreshToken'> => {
  if (env.AUTH_EXPOSE_REFRESH_TOKEN_IN_BODY) {
    return payload;
  }

  const { refreshToken: _refreshToken, ...safePayload } = payload;
  return safePayload;
};

router.post(
  '/login',
  authLoginRateLimit,
  authLoginProgressiveDelay,
  async (req, res, next) => {
    try {
      const payload = loginSchema.parse(req.body);
      const data = await container.authUseCases.login(
        payload,
        getSessionRequestMetadata(req),
      );

      if (data.refreshToken) {
        setRefreshTokenCookie(res, data.refreshToken);
      }

      res.json(sanitizeAuthResponse(data));
    } catch (error) {
      next(error);
    }
  },
);

router.post('/refresh', authRefreshRateLimit, async (req, res, next) => {
  try {
    const payload = refreshTokenSchema.parse(req.body ?? {});
    const refreshToken = extractRefreshTokenFromRequest(req, payload.refreshToken);

    if (!refreshToken) {
      throw new AuthenticationError('Refresh token ausente.');
    }

    const data = await container.authUseCases.refresh(
      refreshToken,
      getSessionRequestMetadata(req),
    );

    if (data.refreshToken) {
      setRefreshTokenCookie(res, data.refreshToken);
    }

    res.json(sanitizeAuthResponse(data));
  } catch (error) {
    next(error);
  }
});

router.post(
  '/forgot-password',
  authForgotPasswordRateLimit,
  async (req, res, next) => {
    try {
      const payload = forgotPasswordSchema.parse(req.body);
      const data = await container.authUseCases.forgotPassword(
        payload,
        getSessionRequestMetadata(req),
      );
      res.status(202).json(data);
    } catch (error) {
      next(error);
    }
  },
);

router.post('/reset-password', authResetPasswordRateLimit, async (req, res, next) => {
  try {
    const payload = resetPasswordSchema.parse(req.body);
    const data = await container.authUseCases.resetPassword(payload);
    clearRefreshTokenCookie(res);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/logout', authMiddleware, async (req, res, next) => {
  try {
    const user = getUserContext(req);
    await container.authUseCases.logout(user);
    clearRefreshTokenCookie(res);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post('/logout-all', authMiddleware, async (req, res, next) => {
  try {
    const user = getUserContext(req);
    await container.authUseCases.logoutAll(user);
    clearRefreshTokenCookie(res);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/sessions', authMiddleware, async (req, res, next) => {
  try {
    const user = getUserContext(req);
    const data = await container.authUseCases.listSessions(user);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.delete('/sessions/:sessionId', authMiddleware, async (req, res, next) => {
  try {
    const user = getUserContext(req);
    const { sessionId } = revokeSessionSchema.parse({
      sessionId: req.params.sessionId,
    });
    await container.authUseCases.revokeSession(user, sessionId);

    if (sessionId === user.sessionId) {
      clearRefreshTokenCookie(res);
    }

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = getUserContext(req);
    const data = await container.authUseCases.me(user);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export { router as authRoutes };
