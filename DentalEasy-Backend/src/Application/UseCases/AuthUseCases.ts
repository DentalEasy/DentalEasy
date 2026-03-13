import bcrypt from 'bcryptjs';
import { LoginDTO } from '../DTOs';
import { PrismaUserRepository } from '../../Infrastructure/Persistence';
import { AuthenticationError } from '../../shared/errors';
import { signAccessToken } from '../../shared/jwt';
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

export interface AuthSessionResponse {
  token: string;
  role: UserRole;
  user: AuthenticatedUserResponse;
  organization: AuthenticatedOrganizationResponse;
}

export class AuthUseCases {
  constructor(private readonly userRepository: PrismaUserRepository) {}

  async login(dto: LoginDTO): Promise<AuthSessionResponse> {
    const user = await this.userRepository.findByEmail(dto.email);

    if (!user || !user.active) {
      throw new AuthenticationError('Credenciais invalidas.');
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new AuthenticationError('Credenciais invalidas.');
    }

    const sessionData = await this.buildSessionData({
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
    });

    const token = signAccessToken({
      sub: user.id,
      organizationId: user.organizationId,
      role: user.role,
    });

    return {
      token,
      ...sessionData,
    };
  }

  async me(userContext: UserContext): Promise<Omit<AuthSessionResponse, 'token'>> {
    return this.buildSessionData(userContext);
  }

  private async buildSessionData(
    userContext: UserContext,
  ): Promise<Omit<AuthSessionResponse, 'token'>> {
    const user = await this.userRepository.findById(userContext.userId);

    if (!user || !user.active) {
      throw new AuthenticationError('Sessao invalida.');
    }

    if (user.organizationId !== userContext.organizationId) {
      throw new AuthenticationError('Sessao invalida para esta organizacao.');
    }

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
}
