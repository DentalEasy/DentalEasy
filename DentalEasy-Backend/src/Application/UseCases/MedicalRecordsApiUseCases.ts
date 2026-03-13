import { MedicalRecordType, Prisma } from '@prisma/client';
import {
  CreateMedicalRecordDTO,
  ListMedicalRecordsQueryDTO,
  UpdateMedicalRecordDTO,
} from '../DTOs';
import { prisma } from '../../Infrastructure/Persistence';
import { ensureRole } from '../../shared/access-control';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { UserContext } from '../../shared/types';
import { ApiUser, mapUser } from './shared-contracts';

export interface ApiMedicalRecord {
  id: string;
  organizationId: string;
  patientId: string;
  dentistId: string;
  dentist: ApiUser;
  type: MedicalRecordType;
  title: string;
  description: string;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
}

const mapAttachments = (value: Prisma.JsonValue | null): string[] | undefined => {
  if (!value || !Array.isArray(value)) {
    return undefined;
  }

  const parsed = value
    .map((item) => (typeof item === 'string' ? item : ''))
    .filter(Boolean);

  return parsed.length > 0 ? parsed : undefined;
};

const mapMedicalRecord = (record: {
  id: string;
  organizationId: string;
  patientId: string;
  dentistUserId: string;
  type: MedicalRecordType;
  title: string;
  description: string;
  attachments: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
  dentist: {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'SECRETARY' | 'DENTIST';
    avatarUrl: string | null;
    organizationId: string;
  };
}): ApiMedicalRecord => ({
  id: record.id,
  organizationId: record.organizationId,
  patientId: record.patientId,
  dentistId: record.dentistUserId,
  dentist: mapUser(record.dentist),
  type: record.type,
  title: record.title,
  description: record.description,
  attachments: mapAttachments(record.attachments),
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

export class MedicalRecordsApiUseCases {
  async listMedicalRecords(
    user: UserContext,
    query: ListMedicalRecordsQueryDTO,
  ): Promise<ApiMedicalRecord[]> {
    ensureRole(user, ['ADMIN', 'DENTIST']);

    const where: Prisma.MedicalRecordWhereInput = {
      organizationId: user.organizationId,
    };

    if (query.patientId) {
      where.patientId = query.patientId;
    }

    if (query.type) {
      where.type = query.type;
    }

    const records = await prisma.medicalRecord.findMany({
      where,
      include: {
        dentist: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => mapMedicalRecord(record));
  }

  async listMedicalRecordsByPatient(
    user: UserContext,
    patientId: string,
  ): Promise<ApiMedicalRecord[]> {
    ensureRole(user, ['ADMIN', 'DENTIST']);

    const patient = await prisma.paciente.findFirst({
      where: {
        id: patientId,
        organizationId: user.organizationId,
      },
    });

    if (!patient) {
      throw new NotFoundError('Paciente nao encontrado.');
    }

    const records = await prisma.medicalRecord.findMany({
      where: {
        organizationId: user.organizationId,
        patientId,
      },
      include: {
        dentist: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => mapMedicalRecord(record));
  }

  async createMedicalRecord(
    user: UserContext,
    dto: CreateMedicalRecordDTO,
  ): Promise<ApiMedicalRecord> {
    ensureRole(user, ['ADMIN', 'DENTIST']);

    const patient = await prisma.paciente.findFirst({
      where: {
        id: dto.patientId,
        organizationId: user.organizationId,
        active: true,
      },
    });

    if (!patient) {
      throw new ValidationError('Paciente invalido para esta organizacao.');
    }

    const created = await prisma.medicalRecord.create({
      data: {
        organizationId: user.organizationId,
        patientId: dto.patientId,
        dentistUserId: user.userId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        attachments: dto.attachments,
      },
      include: {
        dentist: true,
      },
    });

    return mapMedicalRecord(created);
  }

  async updateMedicalRecord(
    user: UserContext,
    medicalRecordId: string,
    dto: UpdateMedicalRecordDTO,
  ): Promise<ApiMedicalRecord> {
    ensureRole(user, ['ADMIN', 'DENTIST']);

    const existing = await prisma.medicalRecord.findFirst({
      where: {
        id: medicalRecordId,
        organizationId: user.organizationId,
      },
      include: {
        dentist: true,
      },
    });

    if (!existing) {
      throw new NotFoundError('Registro clinico nao encontrado.');
    }

    const updated = await prisma.medicalRecord.update({
      where: { id: existing.id },
      data: {
        type: dto.type,
        title: dto.title,
        description: dto.description,
        attachments: dto.attachments,
      },
      include: {
        dentist: true,
      },
    });

    return mapMedicalRecord(updated);
  }

  async deleteMedicalRecord(user: UserContext, medicalRecordId: string): Promise<void> {
    ensureRole(user, ['ADMIN', 'DENTIST']);

    const existing = await prisma.medicalRecord.findFirst({
      where: {
        id: medicalRecordId,
        organizationId: user.organizationId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Registro clinico nao encontrado.');
    }

    await prisma.medicalRecord.delete({ where: { id: existing.id } });
  }
}
