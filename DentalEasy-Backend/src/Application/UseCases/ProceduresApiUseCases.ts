import { Prisma } from '@prisma/client';
import {
  CreateProcedureDTO,
  ListProceduresQueryDTO,
  ToggleProcedureDTO,
  UpdateProcedureDTO,
} from '../DTOs';
import { prisma } from '../../Infrastructure/Persistence';
import { ensureRole } from '../../shared/access-control';
import { NotFoundError } from '../../shared/errors';
import { UserContext } from '../../shared/types';

export interface ApiProcedure {
  id: string;
  organizationId: string;
  name: string;
  description?: string;
  category?: string;
  price: number;
  durationMinutes: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const toAmount = (value: { toNumber(): number } | number): number =>
  typeof value === 'number' ? value : value.toNumber();

const mapProcedure = (record: {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  category: string | null;
  price: { toNumber(): number } | number;
  durationMinutes: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ApiProcedure => ({
  id: record.id,
  organizationId: record.organizationId,
  name: record.name,
  description: record.description ?? undefined,
  category: record.category ?? undefined,
  price: toAmount(record.price),
  durationMinutes: record.durationMinutes,
  active: record.active,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

export class ProceduresApiUseCases {
  async listProcedures(
    user: UserContext,
    query: ListProceduresQueryDTO,
  ): Promise<ApiProcedure[]> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);

    const where: Prisma.ProcedureWhereInput = {
      organizationId: user.organizationId,
    };

    if (query.active !== undefined) {
      where.active = query.active;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const records = await prisma.procedure.findMany({
      where,
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });

    return records.map((record) => mapProcedure(record));
  }

  async getProcedureById(user: UserContext, procedureId: string): Promise<ApiProcedure> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);
    const record = await this.findProcedureOrThrow(user.organizationId, procedureId);
    return mapProcedure(record);
  }

  async createProcedure(
    user: UserContext,
    dto: CreateProcedureDTO,
  ): Promise<ApiProcedure> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);

    const created = await prisma.procedure.create({
      data: {
        organizationId: user.organizationId,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        price: dto.price,
        durationMinutes: dto.durationMinutes,
        active: dto.active ?? true,
      },
    });

    return mapProcedure(created);
  }

  async updateProcedure(
    user: UserContext,
    procedureId: string,
    dto: UpdateProcedureDTO,
  ): Promise<ApiProcedure> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);

    const existing = await this.findProcedureOrThrow(user.organizationId, procedureId);
    const updated = await prisma.procedure.update({
      where: { id: existing.id },
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        price: dto.price,
        durationMinutes: dto.durationMinutes,
        active: dto.active,
      },
    });

    return mapProcedure(updated);
  }

  async toggleProcedure(
    user: UserContext,
    procedureId: string,
    dto: ToggleProcedureDTO,
  ): Promise<ApiProcedure> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);

    const existing = await this.findProcedureOrThrow(user.organizationId, procedureId);
    const updated = await prisma.procedure.update({
      where: { id: existing.id },
      data: {
        active: dto.active ?? !existing.active,
      },
    });

    return mapProcedure(updated);
  }

  async deleteProcedure(user: UserContext, procedureId: string): Promise<void> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);
    const existing = await this.findProcedureOrThrow(user.organizationId, procedureId);
    await prisma.procedure.delete({ where: { id: existing.id } });
  }

  private async findProcedureOrThrow(organizationId: string, procedureId: string) {
    const record = await prisma.procedure.findFirst({
      where: {
        id: procedureId,
        organizationId,
      },
    });

    if (!record) {
      throw new NotFoundError('Procedimento nao encontrado.');
    }

    return record;
  }
}
