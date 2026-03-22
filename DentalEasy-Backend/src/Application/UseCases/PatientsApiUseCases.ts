import { Prisma } from '@prisma/client';
import { CreatePatientDTO, ListPatientsQueryDTO, UpdatePatientDTO } from '../DTOs';
import { prisma } from '../../Infrastructure/Persistence';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { ensureRole } from '../../shared/access-control';
import { UserContext } from '../../shared/types';
import { ApiPatient, mapPatient } from './shared-contracts';

const normalizeDigits = (value: string): string => value.replace(/\D/g, '');

export class PatientsApiUseCases {
  async listPatients(
    user: UserContext,
    query: ListPatientsQueryDTO,
  ): Promise<ApiPatient[]> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);

    const where: Prisma.PacienteWhereInput = {
      organizationId: user.organizationId,
    };

    if (query.active !== undefined) {
      where.active = query.active;
    } else {
      where.active = true;
    }

    if (query.serasaStatus) {
      where.serasaStatus = query.serasaStatus;
    }

    if (query.search) {
      const search = query.search.trim();
      const digits = normalizeDigits(search);

      where.OR = [
        { nome: { contains: search, mode: 'insensitive' } },
        { cpf: { contains: digits.length > 0 ? digits : search } },
        { telefone: { contains: digits.length > 0 ? digits : search } },
      ];
    }

    const patients = await prisma.paciente.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return patients.map((patient) => mapPatient(patient));
  }

  async getPatientById(user: UserContext, patientId: string): Promise<ApiPatient> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);

    const patient = await prisma.paciente.findFirst({
      where: {
        id: patientId,
        organizationId: user.organizationId,
      },
    });

    if (!patient) {
      throw new NotFoundError('Paciente nao encontrado.');
    }

    return mapPatient(patient);
  }

  async createPatient(user: UserContext, dto: CreatePatientDTO): Promise<ApiPatient> {
    ensureRole(user, ['ADMIN', 'SECRETARY']);

    const existing = await prisma.paciente.findFirst({
      where: {
        organizationId: user.organizationId,
        cpf: dto.cpf,
      },
    });

    if (existing) {
      throw new ValidationError('Ja existe paciente com este CPF nesta clinica.');
    }

    const created = await prisma.$transaction(async (tx) => {
      const patient = await tx.paciente.create({
        data: {
          organizationId: user.organizationId,
          nome: dto.name,
          email: dto.email,
          telefone: dto.phone,
          cpf: dto.cpf,
          dataNascimento: dto.birthDate,
          avatarUrl: dto.avatarUrl,
          serasaStatus: dto.serasaStatus ?? 'GREEN',
          endereco: dto.address,
          alergias: dto.allergies,
          observacoesMedicas: dto.medicalNotes,
          active: dto.active ?? true,
        },
      });

      await tx.prontuario.upsert({
        where: {
          pacienteId: patient.id,
        },
        update: {},
        create: {
          organizationId: user.organizationId,
          pacienteId: patient.id,
        },
      });

      return patient;
    });

    return mapPatient(created);
  }

  async updatePatient(
    user: UserContext,
    patientId: string,
    dto: UpdatePatientDTO,
  ): Promise<ApiPatient> {
    ensureRole(user, ['ADMIN', 'SECRETARY']);

    const patient = await prisma.paciente.findFirst({
      where: {
        id: patientId,
        organizationId: user.organizationId,
      },
    });

    if (!patient) {
      throw new NotFoundError('Paciente nao encontrado.');
    }

    if (dto.cpf && dto.cpf !== patient.cpf) {
      const cpfConflict = await prisma.paciente.findFirst({
        where: {
          organizationId: user.organizationId,
          cpf: dto.cpf,
          id: { not: patientId },
        },
      });

      if (cpfConflict) {
        throw new ValidationError('Ja existe paciente com este CPF nesta clinica.');
      }
    }

    const updated = await prisma.paciente.update({
      where: { id: patient.id },
      data: {
        nome: dto.name,
        email: dto.email,
        telefone: dto.phone,
        cpf: dto.cpf,
        dataNascimento: dto.birthDate,
        avatarUrl: dto.avatarUrl,
        serasaStatus: dto.serasaStatus,
        endereco: dto.address,
        alergias: dto.allergies,
        observacoesMedicas: dto.medicalNotes,
        active: dto.active,
      },
    });

    return mapPatient(updated);
  }

  async deletePatient(user: UserContext, patientId: string): Promise<void> {
    ensureRole(user, ['ADMIN', 'SECRETARY']);

    const patient = await prisma.paciente.findFirst({
      where: {
        id: patientId,
        organizationId: user.organizationId,
      },
    });

    if (!patient) {
      throw new NotFoundError('Paciente nao encontrado.');
    }

    await prisma.paciente.update({
      where: { id: patient.id },
      data: { active: false },
    });
  }
}
