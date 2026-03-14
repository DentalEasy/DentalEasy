/* eslint-disable no-console */
const assert = require('node:assert/strict');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const request = require('supertest');

const setTestEnv = () => {
  process.env.NODE_ENV = 'test';
  process.env.PORT = process.env.PORT || '3999';
  process.env.DATABASE_URL =
    process.env.DATABASE_URL
    || 'postgresql://postgres:postgres@localhost:5432/dentaleasy_test?schema=public';
  process.env.JWT_SECRET =
    process.env.JWT_SECRET || 'test-jwt-secret-with-at-least-32-characters-000';
  process.env.JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET
    || 'test-refresh-secret-with-at-least-32-chars-001';
  process.env.JWT_ISSUER = process.env.JWT_ISSUER || 'dentaleasy-tests';
  process.env.JWT_AUDIENCE = process.env.JWT_AUDIENCE || 'dentaleasy-tests';
  process.env.JWT_ACCESS_TOKEN_TTL_MINUTES =
    process.env.JWT_ACCESS_TOKEN_TTL_MINUTES || '10';
  process.env.JWT_REFRESH_TOKEN_TTL_DAYS =
    process.env.JWT_REFRESH_TOKEN_TTL_DAYS || '7';
  process.env.REFRESH_TOKEN_HASH_PEPPER =
    process.env.REFRESH_TOKEN_HASH_PEPPER || 'test-refresh-pepper';
  process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES =
    process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES || '30';
  process.env.BCRYPT_ROUNDS = process.env.BCRYPT_ROUNDS || '10';
  process.env.CORS_ORIGIN =
    process.env.CORS_ORIGIN
    || 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:3002';
  process.env.CORS_CREDENTIALS = process.env.CORS_CREDENTIALS || 'true';
  process.env.CORS_ALLOW_NO_ORIGIN = process.env.CORS_ALLOW_NO_ORIGIN || 'true';
  process.env.BODY_SIZE_LIMIT = process.env.BODY_SIZE_LIMIT || '1mb';
  process.env.TRUST_PROXY = process.env.TRUST_PROXY || '1';
  process.env.AUTH_LOGIN_MAX_ATTEMPTS_PER_ACCOUNT =
    process.env.AUTH_LOGIN_MAX_ATTEMPTS_PER_ACCOUNT || '3';
  process.env.AUTH_LOGIN_BLOCK_MINUTES =
    process.env.AUTH_LOGIN_BLOCK_MINUTES || '10';
  process.env.AUTH_REQUIRE_MFA_FOR_ADMIN =
    process.env.AUTH_REQUIRE_MFA_FOR_ADMIN || 'false';
  process.env.AUTH_VALIDATE_SESSION_ON_REQUEST =
    process.env.AUTH_VALIDATE_SESSION_ON_REQUEST || 'false';
  process.env.AUTH_REFRESH_COOKIE_ENABLED =
    process.env.AUTH_REFRESH_COOKIE_ENABLED || 'true';
  process.env.AUTH_EXPOSE_REFRESH_TOKEN_IN_BODY =
    process.env.AUTH_EXPOSE_REFRESH_TOKEN_IN_BODY || 'true';
  process.env.AUTH_REFRESH_COOKIE_NAME =
    process.env.AUTH_REFRESH_COOKIE_NAME || 'de_refresh_token';
  process.env.AUTH_REFRESH_COOKIE_SECURE =
    process.env.AUTH_REFRESH_COOKIE_SECURE || 'false';
  process.env.AUTH_REFRESH_COOKIE_SAMESITE =
    process.env.AUTH_REFRESH_COOKIE_SAMESITE || 'lax';
  process.env.RATE_LIMIT_LOGIN_WINDOW_MINUTES = '15';
  process.env.RATE_LIMIT_LOGIN_MAX_REQUESTS = '3';
  process.env.RATE_LIMIT_REFRESH_WINDOW_MINUTES = '15';
  process.env.RATE_LIMIT_REFRESH_MAX_REQUESTS = '5';
  process.env.RATE_LIMIT_FORGOT_WINDOW_MINUTES = '15';
  process.env.RATE_LIMIT_FORGOT_MAX_REQUESTS = '2';
  process.env.RATE_LIMIT_RESET_WINDOW_MINUTES = '15';
  process.env.RATE_LIMIT_RESET_MAX_REQUESTS = '2';
};

const uuid = (suffix) => `11111111-1111-4111-8111-${String(suffix).padStart(12, '0')}`;

const matchesWhere = (record, where) => {
  for (const [key, value] of Object.entries(where || {})) {
    if (value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 'gt')) {
      if (!(record[key] instanceof Date) || !(record[key] > value.gt)) {
        return false;
      }
      continue;
    }

    if (value === null) {
      if (record[key] !== null) {
        return false;
      }
      continue;
    }

    if (record[key] !== value) {
      return false;
    }
  }

  return true;
};

const createTestState = async (env) => {
  const hashedPassword = await bcrypt.hash('SenhaForte123A', env.BCRYPT_ROUNDS);
  const user = {
    id: uuid(1),
    name: 'User Test',
    email: 'user@test.com',
    passwordHash: hashedPassword,
    avatarUrl: null,
    role: 'ADMIN',
    active: true,
    organizationId: uuid(2),
    failedLoginAttempts: 0,
    loginBlockedUntil: null,
    mfaEnabled: false,
    mfaSecretEncrypted: null,
    mfaBackupCodesHash: [],
    mfaEnrolledAt: null,
    organization: {
      id: uuid(2),
      nome: 'Clinica Teste',
      slug: 'clinica-teste',
      logoUrl: null,
      email: null,
      phone: null,
      address: null,
      city: null,
      state: null,
      cnpj: null,
      plan: 'PRO',
    },
  };

  const usersById = new Map([[user.id, user]]);
  const usersByEmail = new Map([[user.email, user]]);
  const sessions = new Map();
  const resetTokens = new Map();

  const userRepository = {
    findByEmail: async (email) => usersByEmail.get(email) || null,
    findById: async (userId) => usersById.get(userId) || null,
    registerFailedLogin: async (userId) => {
      const current = usersById.get(userId);
      if (current) current.failedLoginAttempts += 1;
    },
    clearFailedLogins: async (userId) => {
      const current = usersById.get(userId);
      if (!current) return;
      current.failedLoginAttempts = 0;
      current.loginBlockedUntil = null;
    },
    updatePasswordHash: async (userId, passwordHash) => {
      const current = usersById.get(userId);
      if (current) current.passwordHash = passwordHash;
    },
  };

  return {
    user,
    usersById,
    sessions,
    resetTokens,
    userRepository,
  };
};

const installPrismaMocks = (prisma, state) => {
  const restorers = [];
  const patch = (object, methodName, methodImplementation) => {
    const original = object[methodName];
    object[methodName] = methodImplementation;
    restorers.push(() => {
      object[methodName] = original;
    });
  };

  patch(prisma.authSession, 'create', async (args) => {
    const record = {
      id: args.data.id,
      userId: args.data.userId,
      organizationId: args.data.organizationId,
      tokenFamilyId: args.data.tokenFamilyId,
      refreshTokenHash: args.data.refreshTokenHash,
      parentSessionId: args.data.parentSessionId || null,
      userAgent: args.data.userAgent || null,
      ipAddress: args.data.ipAddress || null,
      deviceName: args.data.deviceName || null,
      createdAt: args.data.createdAt || new Date(),
      expiresAt: args.data.expiresAt,
      lastUsedAt: args.data.lastUsedAt || null,
      revokedAt: args.data.revokedAt || null,
      revokeReason: args.data.revokeReason || null,
      mfaVerifiedAt: args.data.mfaVerifiedAt || null,
    };
    state.sessions.set(record.id, record);
    return { ...record };
  });

  patch(prisma.authSession, 'findUnique', async (args) => {
    const session = state.sessions.get(args.where.id);
    if (!session) return null;

    if (args.include && args.include.user) {
      return {
        ...session,
        user: state.usersById.get(session.userId),
      };
    }

    return { ...session };
  });

  patch(prisma.authSession, 'updateMany', async (args) => {
    let count = 0;
    for (const session of state.sessions.values()) {
      if (!matchesWhere(session, args.where || {})) {
        continue;
      }
      Object.assign(session, args.data);
      count += 1;
    }
    return { count };
  });

  patch(prisma.authSession, 'findMany', async (args) => {
    const found = [...state.sessions.values()]
      .filter((session) => matchesWhere(session, args.where || {}))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return found.map((session) => ({ ...session }));
  });

  patch(prisma.authSession, 'findFirst', async (args) => {
    const found = [...state.sessions.values()].find((session) =>
      matchesWhere(session, args.where || {}));
    if (!found) return null;
    if (args.select && args.select.id) return { id: found.id };
    return { ...found };
  });

  patch(prisma.passwordResetToken, 'updateMany', async (args) => {
    let count = 0;
    for (const token of state.resetTokens.values()) {
      if (!matchesWhere(token, args.where || {})) {
        continue;
      }
      Object.assign(token, args.data);
      count += 1;
    }
    return { count };
  });

  patch(prisma.passwordResetToken, 'create', async (args) => {
    const record = {
      id: args.data.id || crypto.randomUUID(),
      userId: args.data.userId,
      tokenHash: args.data.tokenHash,
      createdAt: args.data.createdAt || new Date(),
      expiresAt: args.data.expiresAt,
      usedAt: args.data.usedAt || null,
      requestedIp: args.data.requestedIp || null,
      requestedUserAgent: args.data.requestedUserAgent || null,
    };
    state.resetTokens.set(record.id, record);
    return { ...record };
  });

  patch(prisma.passwordResetToken, 'findUnique', async (args) => {
    const record = [...state.resetTokens.values()].find(
      (token) => token.tokenHash === args.where.tokenHash,
    );
    if (!record) return null;
    if (args.include && args.include.user) {
      return {
        ...record,
        user: state.usersById.get(record.userId),
      };
    }
    return { ...record };
  });

  patch(prisma.passwordResetToken, 'update', async (args) => {
    const record = state.resetTokens.get(args.where.id);
    if (!record) throw new Error('Reset token nao encontrado');
    Object.assign(record, args.data);
    return { ...record };
  });

  patch(prisma.user, 'update', async (args) => {
    const user = state.usersById.get(args.where.id);
    if (!user) throw new Error('Usuario nao encontrado');
    Object.assign(user, args.data);
    return { ...user };
  });

  patch(prisma, '$transaction', async (arg) => {
    if (typeof arg === 'function') {
      return arg(prisma);
    }
    return Promise.all(arg);
  });

  return () => {
    restorers.reverse().forEach((restore) => restore());
  };
};

const run = async () => {
  setTestEnv();

  const { env } = require('../dist/config/env');
  const { app } = require('../dist/app');
  const { container } = require('../dist/container');
  const { AuthUseCases } = require('../dist/Application/UseCases/AuthUseCases');
  const { prisma } = require('../dist/Infrastructure/Persistence');
  const { AuthenticationError } = require('../dist/shared/errors');
  const { signAccessToken } = require('../dist/shared/jwt');

  let passed = 0;
  let failed = 0;

  const runTest = async (name, fn) => {
    try {
      await fn();
      passed += 1;
      console.log(`PASS ${name}`);
    } catch (error) {
      failed += 1;
      console.error(`FAIL ${name}`);
      console.error(error);
    }
  };

  const mockedAuthResponse = {
    token: 'mock-access-token',
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
    sessionId: uuid(101),
    accessTokenExpiresInMinutes: 10,
    refreshTokenExpiresInDays: 7,
    role: 'ADMIN',
    user: {
      id: uuid(102),
      name: 'User Test',
      email: 'user@test.com',
      role: 'ADMIN',
      organizationId: uuid(103),
    },
    organization: {
      id: uuid(103),
      name: 'Org Test',
      slug: 'org-test',
      plan: 'PRO',
    },
  };

  const originalAuthUseCases = {
    login: container.authUseCases.login,
    refresh: container.authUseCases.refresh,
    forgotPassword: container.authUseCases.forgotPassword,
    resetPassword: container.authUseCases.resetPassword,
    logout: container.authUseCases.logout,
    logoutAll: container.authUseCases.logoutAll,
    listSessions: container.authUseCases.listSessions,
    revokeSession: container.authUseCases.revokeSession,
  };

  container.authUseCases.login = async () => mockedAuthResponse;
  container.authUseCases.refresh = async () => mockedAuthResponse;
  container.authUseCases.forgotPassword = async () => ({
    message:
      'Se o e-mail informado existir, enviaremos instrucoes para recuperar a senha.',
  });
  container.authUseCases.resetPassword = async () => ({
    message: 'Senha atualizada com sucesso.',
  });
  container.authUseCases.logout = async () => undefined;
  container.authUseCases.logoutAll = async () => undefined;
  container.authUseCases.listSessions = async () => [];
  container.authUseCases.revokeSession = async () => undefined;

  await runTest('security headers and restrictive CORS', async () => {
    const healthResponse = await request(app).get('/health').expect(200);
    assert.equal(healthResponse.headers['x-powered-by'], undefined);
    assert.equal(healthResponse.headers['x-dns-prefetch-control'], 'off');

    const allowedCors = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'http://localhost:3000')
      .set('Access-Control-Request-Method', 'POST')
      .expect(204);
    assert.equal(
      allowedCors.headers['access-control-allow-origin'],
      'http://localhost:3000',
    );

    const deniedCors = await request(app)
      .options('/api/auth/login')
      .set('Origin', 'https://origem-nao-confiavel.tld')
      .set('Access-Control-Request-Method', 'POST');
    assert.ok([200, 204].includes(deniedCors.status));
    assert.equal(deniedCors.headers['access-control-allow-origin'], undefined);
  });

  await runTest('invalid content-type rejected with 415', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '10.10.10.10')
      .set('Content-Type', 'text/plain')
      .send('email=user@test.com&password=123')
      .expect(415);
    assert.equal(response.body.error.code, 'UNSUPPORTED_MEDIA_TYPE');
  });

  await runTest('json payload limit is enforced', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('X-Forwarded-For', '10.10.10.11')
      .send({
        email: 'user@test.com',
        password: 'A'.repeat(1024 * 1024 + 200),
      })
      .expect(413);
    assert.equal(response.body.error.code, 'PAYLOAD_TOO_LARGE');
  });

  await runTest('rate limits login refresh and forgot-password', async () => {
    const loginStatuses = [];
    for (let index = 0; index < 8; index += 1) {
      const response = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '20.20.20.1')
        .send({ email: 'user@test.com', password: 'qualquer-senha' });
      loginStatuses.push(response.status);
    }
    assert.equal(loginStatuses.includes(429), true);

    const refreshStatuses = [];
    for (let index = 0; index < 10; index += 1) {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('X-Forwarded-For', '20.20.20.2')
        .send({ refreshToken: 'any-refresh-token-that-is-long-enough-12345' });
      refreshStatuses.push(response.status);
    }
    assert.equal(refreshStatuses.includes(429), true);

    const forgotStatuses = [];
    for (let index = 0; index < 5; index += 1) {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .set('X-Forwarded-For', '20.20.20.3')
        .send({ email: 'user@test.com' });
      forgotStatuses.push(response.status);
    }
    assert.equal(forgotStatuses.includes(429), true);
  });

  await runTest('error handler hides stacktrace in production', async () => {
    const previousEnv = env.NODE_ENV;
    const originalLogin = container.authUseCases.login;
    const originalConsoleError = console.error;
    try {
      env.NODE_ENV = 'production';
      container.authUseCases.login = async () => {
        throw new Error('boom-test');
      };
      console.error = () => undefined;

      const response = await request(app)
        .post('/api/auth/login')
        .set('X-Forwarded-For', '30.30.30.1')
        .send({ email: 'user@test.com', password: 'qualquer-senha' })
        .expect(500);
      assert.equal(response.body.error.code, 'INTERNAL_SERVER_ERROR');
      assert.equal(response.body.error.details, undefined);
    } finally {
      container.authUseCases.login = originalLogin;
      env.NODE_ENV = previousEnv;
      console.error = originalConsoleError;
    }
  });

  container.authUseCases.login = originalAuthUseCases.login;
  container.authUseCases.refresh = originalAuthUseCases.refresh;
  container.authUseCases.forgotPassword = originalAuthUseCases.forgotPassword;
  container.authUseCases.resetPassword = originalAuthUseCases.resetPassword;
  container.authUseCases.logout = originalAuthUseCases.logout;
  container.authUseCases.logoutAll = originalAuthUseCases.logoutAll;
  container.authUseCases.listSessions = originalAuthUseCases.listSessions;
  container.authUseCases.revokeSession = originalAuthUseCases.revokeSession;

  await runTest('access token has short TTL (10-15 minutes)', async () => {
    const token = signAccessToken({
      sub: uuid(11),
      organizationId: uuid(12),
      role: 'ADMIN',
      sessionId: uuid(13),
    });

    const payload = JSON.parse(
      Buffer.from(token.split('.')[1], 'base64url').toString('utf-8'),
    );
    const ttlSeconds = payload.exp - payload.iat;
    assert.ok(ttlSeconds >= 10 * 60);
    assert.ok(ttlSeconds <= 15 * 60);
  });

  await runTest('refresh token rotation invalidates old token and detects reuse', async () => {
    const state = await createTestState(env);
    const restorePrisma = installPrismaMocks(prisma, state);
    const authUseCases = new AuthUseCases(state.userRepository);
    try {
      const login = await authUseCases.login(
        { email: state.user.email, password: 'SenhaForte123A' },
        { ipAddress: '127.0.0.1', userAgent: 'unit-test' },
      );

      assert.ok(login.refreshToken);
      const firstSession = state.sessions.get(login.sessionId);
      assert.ok(firstSession);
      assert.notEqual(firstSession.refreshTokenHash, login.refreshToken);

      const rotated = await authUseCases.refresh(login.refreshToken, {
        ipAddress: '127.0.0.1',
        userAgent: 'unit-test',
      });

      assert.notEqual(rotated.sessionId, login.sessionId);
      assert.notEqual(rotated.refreshToken, login.refreshToken);
      assert.equal(state.sessions.get(login.sessionId).revokeReason, 'ROTATED');

      await assert.rejects(
        authUseCases.refresh(login.refreshToken, {
          ipAddress: '127.0.0.1',
          userAgent: 'unit-test',
        }),
        (error) =>
          error instanceof AuthenticationError
          && error.message === 'Token invalido ou expirado.',
      );

      const familySessions = [...state.sessions.values()].filter(
        (session) => session.tokenFamilyId === state.sessions.get(rotated.sessionId).tokenFamilyId,
      );
      assert.equal(
        familySessions.some(
          (session) => session.revokeReason === 'TOKEN_REUSE_DETECTED',
        ),
        true,
      );
    } finally {
      restorePrisma();
    }
  });

  await runTest('logout and session revoke by sessionId work', async () => {
    const state = await createTestState(env);
    const restorePrisma = installPrismaMocks(prisma, state);
    const authUseCases = new AuthUseCases(state.userRepository);
    try {
      const firstLogin = await authUseCases.login(
        { email: state.user.email, password: 'SenhaForte123A' },
        { ipAddress: '127.0.0.1', userAgent: 'browser-1', deviceName: 'device-1' },
      );

      const secondLogin = await authUseCases.login(
        { email: state.user.email, password: 'SenhaForte123A' },
        { ipAddress: '127.0.0.2', userAgent: 'browser-2', deviceName: 'device-2' },
      );

      await authUseCases.logout({
        userId: state.user.id,
        organizationId: state.user.organizationId,
        role: state.user.role,
        sessionId: firstLogin.sessionId,
        tokenId: uuid(999),
      });
      assert.equal(state.sessions.get(firstLogin.sessionId).revokeReason, 'LOGOUT');

      await authUseCases.revokeSession(
        {
          userId: state.user.id,
          organizationId: state.user.organizationId,
          role: state.user.role,
          sessionId: secondLogin.sessionId,
          tokenId: uuid(998),
        },
        secondLogin.sessionId,
      );
      assert.equal(state.sessions.get(secondLogin.sessionId).revokeReason, 'MANUAL_REVOKE');
    } finally {
      restorePrisma();
    }
  });

  await runTest('reset password uses hashed token and stores bcrypt hash', async () => {
    const state = await createTestState(env);
    const restorePrisma = installPrismaMocks(prisma, state);
    const authUseCases = new AuthUseCases(state.userRepository);
    try {
      await authUseCases.login(
        { email: state.user.email, password: 'SenhaForte123A' },
        { ipAddress: '127.0.0.1', userAgent: 'browser' },
      );

      const forgotKnown = await authUseCases.forgotPassword(
        { email: state.user.email },
        { ipAddress: '127.0.0.1', userAgent: 'browser' },
      );
      const forgotUnknown = await authUseCases.forgotPassword(
        { email: 'nao-existe@teste.com' },
        { ipAddress: '127.0.0.1', userAgent: 'browser' },
      );

      assert.equal(forgotKnown.message, forgotUnknown.message);
      assert.ok(forgotKnown.resetToken);

      const storedResetToken = [...state.resetTokens.values()][0];
      assert.notEqual(storedResetToken.tokenHash, forgotKnown.resetToken);

      await authUseCases.resetPassword({
        token: forgotKnown.resetToken,
        password: 'NovaSenhaForte123',
      });

      assert.ok(storedResetToken.usedAt instanceof Date);
      assert.notEqual(state.user.passwordHash, 'NovaSenhaForte123');
      assert.equal(await bcrypt.compare('NovaSenhaForte123', state.user.passwordHash), true);

      const activeSessions = [...state.sessions.values()].filter(
        (session) => session.revokedAt === null,
      );
      assert.equal(activeSessions.length, 0);
    } finally {
      restorePrisma();
    }
  });

  await runTest('login and forgot-password responses are generic (no enumeration)', async () => {
    const state = await createTestState(env);
    const restorePrisma = installPrismaMocks(prisma, state);
    const authUseCases = new AuthUseCases(state.userRepository);
    try {
      await assert.rejects(
        authUseCases.login(
          { email: 'nao-existe@teste.com', password: 'senha-qualquer' },
          { ipAddress: '127.0.0.1', userAgent: 'browser' },
        ),
        (error) =>
          error instanceof AuthenticationError
          && error.message === 'Credenciais invalidas.',
      );

      await assert.rejects(
        authUseCases.login(
          { email: state.user.email, password: 'senha-errada' },
          { ipAddress: '127.0.0.1', userAgent: 'browser' },
        ),
        (error) =>
          error instanceof AuthenticationError
          && error.message === 'Credenciais invalidas.',
      );

      const known = await authUseCases.forgotPassword(
        { email: state.user.email },
        { ipAddress: '127.0.0.1', userAgent: 'browser' },
      );
      const unknown = await authUseCases.forgotPassword(
        { email: 'sem-conta@teste.com' },
        { ipAddress: '127.0.0.1', userAgent: 'browser' },
      );
      assert.equal(known.message, unknown.message);
    } finally {
      restorePrisma();
    }
  });

  console.log(`\nSummary: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exitCode = 1;
  }
};

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
