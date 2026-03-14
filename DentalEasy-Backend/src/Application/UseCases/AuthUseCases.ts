import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import {
  ForgotPasswordDTO,
  LoginDTO,
  ResetPasswordDTO,
} from '../DTOs';
import { env } from '../../config/env';
import { prisma, PrismaUserRepository } from '../../Infrastructure/Persistence';
import {
  AuthenticationError,
  DomainError,
  NotFoundError,
  TooManyRequestsError,
} from '../../shared/errors';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../shared/jwt';
import { assertStrongPassword } from '../../shared/password-policy';
import { UserContext, UserRole } from '../../shared/types';

export interface AuthenticatedUserResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  organizationId: string;
}

export interface AuthenticatedOrganizationResponse {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  cnpj?: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
}

interface AuthSessionContextData {
  role: UserRole;
  user: AuthenticatedUserResponse;
  organization: AuthenticatedOrganizationResponse;
}

interface IssuedAuthTokens {
  sessionId: string;
  tokenFamilyId: string;
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export interface AuthSessionResponse extends AuthSessionContextData {
  token: string;
  accessToken: string;
  refreshToken?: string;
  sessionId: string;
  accessTokenExpiresInMinutes: number;
  refreshTokenExpiresInDays: number;
}

export interface AuthSessionSnapshotResponse {
  id: string;
  isCurrent: boolean;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt: string;
  userAgent?: string;
  ipAddress?: string;
  deviceName?: string;
}

export interface AuthForgotPasswordResponse {
  message: string;
  resetToken?: string;
}

interface SessionRequestMetadata {
  ipAddress?: string;
  userAgent?: string;
  deviceName?: string;
}

const genericForgotPasswordMessage =
  'Se o e-mail informado existir, enviaremos instrucoes para recuperar a senha.';

const fallbackPasswordHash = bcrypt.hashSync(
  'fallback-password-for-timing-protection-only',
  env.BCRYPT_ROUNDS,
);

const normalizeOptionalMetadata = (
  value: string | null | undefined,
): string | undefined => {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized.slice(0, 300) : undefined;
};

export class AuthUseCases {
  constructor(private readonly userRepository: PrismaUserRepository) {}

  async login(
    dto: LoginDTO,
    metadata: SessionRequestMetadata,
  ): Promise<AuthSessionResponse> {
    const user = await this.userRepository.findByEmail(dto.email);
    const passwordHashForCheck = user?.passwordHash ?? fallbackPasswordHash;
    const passwordMatches = await bcrypt
      .compare(dto.password, passwordHashForCheck)
      .catch(() => false);

    if (!user || !user.active || !passwordMatches) {
      if (user) {
        await this.userRepository.registerFailedLogin(user.id);
      }
      throw new AuthenticationError('Credenciais invalidas.');
    }

    if (user.loginBlockedUntil && user.loginBlockedUntil > new Date()) {
      throw new TooManyRequestsError();
    }

    this.enforceAdminMfaPolicy(user, dto.mfaCode);

    await this.userRepository.clearFailedLogins(user.id);
    await this.rehashPasswordIfNeeded(user.id, user.passwordHash, dto.password);

    const tokens = await this.createSessionTokens({
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
      metadata,
    });

    return this.buildAuthSessionResponse(this.mapSessionDataFromUser(user), tokens);
  }

  async refresh(
    refreshToken: string,
    metadata: SessionRequestMetadata,
  ): Promise<AuthSessionResponse> {
    const refreshPayload = verifyRefreshToken(refreshToken);
    const refreshTokenHash = this.hashSensitiveToken(refreshToken);

    const currentSession = await prisma.authSession.findUnique({
      where: { id: refreshPayload.sid },
      include: {
        user: {
          include: {
            organization: true,
          },
        },
      },
    });

    if (
      !currentSession ||
      currentSession.userId !== refreshPayload.sub ||
      currentSession.organizationId !== refreshPayload.organizationId ||
      currentSession.tokenFamilyId !== refreshPayload.tokenFamilyId ||
      currentSession.refreshTokenHash !== refreshTokenHash ||
      !currentSession.user.active
    ) {
      if (currentSession) {
        await this.revokeTokenFamily(
          currentSession.tokenFamilyId,
          'TOKEN_REUSE_DETECTED',
        );
      }
      throw new AuthenticationError('Token invalido ou expirado.');
    }

    if (currentSession.expiresAt <= new Date()) {
      await this.revokeSessionRecord(currentSession.id, 'TOKEN_EXPIRED');
      throw new AuthenticationError('Token invalido ou expirado.');
    }

    if (currentSession.revokedAt) {
      if (currentSession.revokeReason === 'ROTATED') {
        await this.revokeTokenFamily(
          currentSession.tokenFamilyId,
          'TOKEN_REUSE_DETECTED',
        );
      }
      throw new AuthenticationError('Token invalido ou expirado.');
    }

    this.enforceAdminMfaPolicy(currentSession.user);

    const nextSessionId = crypto.randomUUID();
    const nextRefreshToken = signRefreshToken({
      sub: currentSession.userId,
      organizationId: currentSession.organizationId,
      role: currentSession.user.role,
      sessionId: nextSessionId,
      tokenFamilyId: currentSession.tokenFamilyId,
    });
    const nextRefreshTokenHash = this.hashSensitiveToken(nextRefreshToken);
    const refreshTokenExpiresAt = this.calculateRefreshTokenExpiry();

    const rotationSucceeded = await prisma.$transaction(async (tx) => {
      const rotation = await tx.authSession.updateMany({
        where: {
          id: currentSession.id,
          userId: currentSession.userId,
          refreshTokenHash,
          revokedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: {
          revokedAt: new Date(),
          revokeReason: 'ROTATED',
          lastUsedAt: new Date(),
        },
      });

      if (rotation.count !== 1) {
        return false;
      }

      await tx.authSession.create({
        data: {
          id: nextSessionId,
          userId: currentSession.userId,
          organizationId: currentSession.organizationId,
          tokenFamilyId: currentSession.tokenFamilyId,
          parentSessionId: currentSession.id,
          refreshTokenHash: nextRefreshTokenHash,
          userAgent: normalizeOptionalMetadata(metadata.userAgent)
            ?? currentSession.userAgent
            ?? undefined,
          ipAddress: normalizeOptionalMetadata(metadata.ipAddress)
            ?? currentSession.ipAddress
            ?? undefined,
          deviceName: normalizeOptionalMetadata(metadata.deviceName)
            ?? currentSession.deviceName
            ?? undefined,
          expiresAt: refreshTokenExpiresAt,
          lastUsedAt: null,
        },
      });

      return true;
    });

    if (!rotationSucceeded) {
      await this.revokeTokenFamily(
        currentSession.tokenFamilyId,
        'TOKEN_REUSE_DETECTED',
      );
      throw new AuthenticationError('Token invalido ou expirado.');
    }

    const accessToken = signAccessToken({
      sub: currentSession.userId,
      organizationId: currentSession.organizationId,
      role: currentSession.user.role,
      sessionId: nextSessionId,
    });

    return this.buildAuthSessionResponse(
      this.mapSessionDataFromUser(currentSession.user),
      {
        sessionId: nextSessionId,
        tokenFamilyId: currentSession.tokenFamilyId,
        accessToken,
        refreshToken: nextRefreshToken,
        refreshTokenExpiresAt,
      },
    );
  }

  async logout(userContext: UserContext): Promise<void> {
    await prisma.authSession.updateMany({
      where: {
        id: userContext.sessionId,
        userId: userContext.userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokeReason: 'LOGOUT',
        lastUsedAt: new Date(),
      },
    });
  }

  async logoutAll(userContext: UserContext): Promise<void> {
    await prisma.authSession.updateMany({
      where: {
        userId: userContext.userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokeReason: 'LOGOUT_ALL',
      },
    });
  }

  async listSessions(userContext: UserContext): Promise<AuthSessionSnapshotResponse[]> {
    const sessions = await prisma.authSession.findMany({
      where: {
        userId: userContext.userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return sessions.map((session) => ({
      id: session.id,
      isCurrent: session.id === userContext.sessionId,
      createdAt: session.createdAt.toISOString(),
      lastUsedAt: session.lastUsedAt?.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      userAgent: session.userAgent ?? undefined,
      ipAddress: session.ipAddress ?? undefined,
      deviceName: session.deviceName ?? undefined,
    }));
  }

  async revokeSession(userContext: UserContext, sessionId: string): Promise<void> {
    const existing = await prisma.authSession.findFirst({
      where: {
        id: sessionId,
        userId: userContext.userId,
      },
      select: {
        id: true,
      },
    });

    if (!existing) {
      throw new NotFoundError('Sessao nao encontrada.');
    }

    await prisma.authSession.updateMany({
      where: {
        id: sessionId,
        userId: userContext.userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokeReason: 'MANUAL_REVOKE',
      },
    });
  }

  async forgotPassword(
    dto: ForgotPasswordDTO,
    metadata: SessionRequestMetadata,
  ): Promise<AuthForgotPasswordResponse> {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user || !user.active) {
      return { message: genericForgotPasswordMessage };
    }

    const rawResetToken = crypto.randomBytes(48).toString('hex');
    const resetTokenHash = this.hashSensitiveToken(rawResetToken);
    const expiresAt = new Date(
      Date.now() + env.PASSWORD_RESET_TOKEN_TTL_MINUTES * 60 * 1000,
    );

    await prisma.$transaction(async (tx) => {
      await tx.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
        data: {
          usedAt: new Date(),
        },
      });

      await tx.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: resetTokenHash,
          expiresAt,
          requestedIp: normalizeOptionalMetadata(metadata.ipAddress),
          requestedUserAgent: normalizeOptionalMetadata(metadata.userAgent),
        },
      });
    });

    return {
      message: genericForgotPasswordMessage,
      resetToken:
        env.NODE_ENV === 'production' ? undefined : rawResetToken,
    };
  }

  async resetPassword(dto: ResetPasswordDTO): Promise<{ message: string }> {
    assertStrongPassword(dto.password);
    const tokenHash = this.hashSensitiveToken(dto.token);

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !resetRecord ||
      resetRecord.usedAt ||
      resetRecord.expiresAt <= new Date()
    ) {
      throw new AuthenticationError('Token invalido ou expirado.');
    }

    const passwordHash = await bcrypt.hash(dto.password, env.BCRYPT_ROUNDS);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: resetRecord.userId },
        data: {
          passwordHash,
          failedLoginAttempts: 0,
          loginBlockedUntil: null,
        },
      });

      await tx.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: {
          usedAt: new Date(),
        },
      });

      await tx.authSession.updateMany({
        where: {
          userId: resetRecord.userId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          revokeReason: 'PASSWORD_RESET',
        },
      });
    });

    return {
      message: 'Senha atualizada com sucesso.',
    };
  }

  async me(userContext: UserContext): Promise<AuthSessionContextData> {
    const user = await this.userRepository.findById(userContext.userId);

    if (!user || !user.active) {
      throw new AuthenticationError('Sessao invalida.');
    }

    if (user.organizationId !== userContext.organizationId) {
      throw new AuthenticationError('Sessao invalida para esta organizacao.');
    }

    return this.mapSessionDataFromUser(user);
  }

  private async createSessionTokens(input: {
    userId: string;
    organizationId: string;
    role: UserRole;
    metadata: SessionRequestMetadata;
  }): Promise<IssuedAuthTokens> {
    const tokenFamilyId = crypto.randomUUID();
    const sessionId = crypto.randomUUID();
    const accessToken = signAccessToken({
      sub: input.userId,
      organizationId: input.organizationId,
      role: input.role,
      sessionId,
    });
    const refreshToken = signRefreshToken({
      sub: input.userId,
      organizationId: input.organizationId,
      role: input.role,
      sessionId,
      tokenFamilyId,
    });
    const refreshTokenHash = this.hashSensitiveToken(refreshToken);
    const refreshTokenExpiresAt = this.calculateRefreshTokenExpiry();

    await prisma.authSession.create({
      data: {
        id: sessionId,
        userId: input.userId,
        organizationId: input.organizationId,
        tokenFamilyId,
        refreshTokenHash,
        userAgent: normalizeOptionalMetadata(input.metadata.userAgent),
        ipAddress: normalizeOptionalMetadata(input.metadata.ipAddress),
        deviceName: normalizeOptionalMetadata(input.metadata.deviceName),
        expiresAt: refreshTokenExpiresAt,
      },
    });

    return {
      sessionId,
      tokenFamilyId,
      accessToken,
      refreshToken,
      refreshTokenExpiresAt,
    };
  }

  private mapSessionDataFromUser(user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    avatarUrl: string | null;
    organizationId: string;
    organization: {
      id: string;
      nome: string;
      slug: string;
      logoUrl: string | null;
      phone: string | null;
      address: string | null;
      city: string | null;
      state: string | null;
      cnpj: string | null;
      plan: 'FREE' | 'PRO' | 'ENTERPRISE';
    };
  }): AuthSessionContextData {
    return {
      role: user.role,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl ?? undefined,
        organizationId: user.organizationId,
      },
      organization: {
        id: user.organization.id,
        name: user.organization.nome,
        slug: user.organization.slug,
        logoUrl: user.organization.logoUrl ?? undefined,
        phone: user.organization.phone ?? undefined,
        address: user.organization.address ?? undefined,
        city: user.organization.city ?? undefined,
        state: user.organization.state ?? undefined,
        cnpj: user.organization.cnpj ?? undefined,
        plan: user.organization.plan,
      },
    };
  }

  private buildAuthSessionResponse(
    sessionData: AuthSessionContextData,
    tokens: IssuedAuthTokens,
  ): AuthSessionResponse {
    return {
      ...sessionData,
      token: tokens.accessToken,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      sessionId: tokens.sessionId,
      accessTokenExpiresInMinutes: env.JWT_ACCESS_TOKEN_TTL_MINUTES,
      refreshTokenExpiresInDays: env.JWT_REFRESH_TOKEN_TTL_DAYS,
    };
  }

  private hashSensitiveToken(value: string): string {
    return crypto
      .createHash('sha256')
      .update(`${value}${env.REFRESH_TOKEN_HASH_PEPPER}`)
      .digest('hex');
  }

  private calculateRefreshTokenExpiry(): Date {
    return new Date(Date.now() + env.JWT_REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
  }

  private enforceAdminMfaPolicy(
    user: {
      role: UserRole;
      mfaEnabled: boolean;
      mfaSecretEncrypted: string | null;
    },
    mfaCode?: string,
  ): void {
    if (!env.AUTH_REQUIRE_MFA_FOR_ADMIN || user.role !== 'ADMIN') {
      return;
    }

    if (!user.mfaEnabled || !user.mfaSecretEncrypted) {
      throw new DomainError(
        'MFA obrigatorio para contas administrativas.',
        403,
        'MFA_ENROLLMENT_REQUIRED',
      );
    }

    if (!mfaCode) {
      throw new DomainError(
        'MFA requerido para concluir autenticacao.',
        403,
        'MFA_CHALLENGE_REQUIRED',
      );
    }

    throw new DomainError(
      'Fluxo de verificacao MFA ainda nao implementado.',
      501,
      'MFA_NOT_IMPLEMENTED',
    );
  }

  private async rehashPasswordIfNeeded(
    userId: string,
    currentHash: string,
    rawPassword: string,
  ): Promise<void> {
    let currentRounds = 0;
    try {
      currentRounds = bcrypt.getRounds(currentHash);
    } catch {
      return;
    }

    if (currentRounds >= env.BCRYPT_ROUNDS) {
      return;
    }

    const upgradedHash = await bcrypt.hash(rawPassword, env.BCRYPT_ROUNDS);
    await this.userRepository.updatePasswordHash(userId, upgradedHash);
  }

  private async revokeTokenFamily(
    tokenFamilyId: string,
    reason: string,
  ): Promise<void> {
    await prisma.authSession.updateMany({
      where: {
        tokenFamilyId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokeReason: reason,
      },
    });
  }

  private async revokeSessionRecord(
    sessionId: string,
    reason: string,
  ): Promise<void> {
    await prisma.authSession.updateMany({
      where: {
        id: sessionId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokeReason: reason,
      },
    });
  }
}
