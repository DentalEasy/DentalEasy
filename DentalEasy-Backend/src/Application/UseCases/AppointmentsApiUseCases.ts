import { AppointmentStatus, Prisma } from '@prisma/client';
import {
  CreateAppointmentDTO,
  ListAppointmentsQueryDTO,
  UpdateAppointmentDTO,
  UpdateAppointmentStatusDTO,
} from '../DTOs';
import { prisma } from '../../Infrastructure/Persistence';
import { ensureRole } from '../../shared/access-control';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { UserContext } from '../../shared/types';
import { ApiPatient, ApiUser, mapPatient, mapUser, toISODate } from './shared-contracts';

export interface ApiAppointment {
  id: string;
  organizationId: string;
  patientId: string;
  dentistId: string;
  patient: ApiPatient;
  dentist: ApiUser;
  date: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  title?: string;
  procedure?: string;
  notes?: string;
  reminderSent: boolean;
  createdAt: string;
  updatedAt: string;
}

const timeToMinutes = (value: string): number => {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
};

const normalizeDateOnly = (value: Date): Date => {
  const normalized = value.toISOString().split('T')[0];
  return new Date(`${normalized}T00:00:00.000Z`);
};

const assertTimeRange = (startTime: string, endTime: string): void => {
  if (timeToMinutes(startTime) >= timeToMinutes(endTime)) {
    throw new ValidationError(
      'Horario invalido: inicio deve ser anterior ao termino.',
    );
  }
};

const mapAppointment = (appointment: {
  id: string;
  organizationId: string;
  patientId: string;
  dentistUserId: string;
  date: Date;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  title: string | null;
  procedure: string | null;
  notes: string | null;
  reminderSent: boolean;
  createdAt: Date;
  updatedAt: Date;
  patient: {
    id: string;
    organizationId: string;
    nome: string;
    email: string | null;
    telefone: string;
    cpf: string;
    dataNascimento: Date;
    avatarUrl: string | null;
    serasaStatus: 'GREEN' | 'YELLOW' | 'RED';
    endereco: string | null;
    alergias: string | null;
    observacoesMedicas: string | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  dentist: {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'SECRETARY' | 'DENTIST';
    avatarUrl: string | null;
    organizationId: string;
  };
}): ApiAppointment => ({
  id: appointment.id,
  organizationId: appointment.organizationId,
  patientId: appointment.patientId,
  dentistId: appointment.dentistUserId,
  patient: mapPatient(appointment.patient),
  dentist: mapUser(appointment.dentist),
  date: toISODate(appointment.date),
  startTime: appointment.startTime,
  endTime: appointment.endTime,
  status: appointment.status,
  title: appointment.title ?? undefined,
  procedure: appointment.procedure ?? undefined,
  notes: appointment.notes ?? undefined,
  reminderSent: appointment.reminderSent,
  createdAt: appointment.createdAt.toISOString(),
  updatedAt: appointment.updatedAt.toISOString(),
});

export class AppointmentsApiUseCases {
  async listAppointments(
    user: UserContext,
    query: ListAppointmentsQueryDTO,
  ): Promise<ApiAppointment[]> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);

    const where: Prisma.AppointmentWhereInput = {
      organizationId: user.organizationId,
    };

    if (query.date) {
      const date = normalizeDateOnly(new Date(`${query.date}T00:00:00.000Z`));
      where.date = date;
    }

    if (query.dentistId) {
      where.dentistUserId = query.dentistId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.patientId) {
      where.patientId = query.patientId;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: true,
        dentist: true,
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return appointments.map((appointment) => mapAppointment(appointment));
  }

  async getAppointmentById(
    user: UserContext,
    appointmentId: string,
  ): Promise<ApiAppointment> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);

    const appointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        organizationId: user.organizationId,
      },
      include: {
        patient: true,
        dentist: true,
      },
    });

    if (!appointment) {
      throw new NotFoundError('Agendamento nao encontrado.');
    }

    return mapAppointment(appointment);
  }

  async createAppointment(
    user: UserContext,
    dto: CreateAppointmentDTO,
  ): Promise<ApiAppointment> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);
    assertTimeRange(dto.startTime, dto.endTime);

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

    const dentist = await prisma.user.findFirst({
      where: {
        id: dto.dentistId,
        organizationId: user.organizationId,
        role: 'DENTIST',
        active: true,
      },
    });

    if (!dentist) {
      throw new ValidationError('Dentista invalido para esta organizacao.');
    }

    const date = normalizeDateOnly(dto.date);
    await this.assertNoScheduleConflict(
      user.organizationId,
      dto.dentistId,
      date,
      dto.startTime,
      dto.endTime,
    );

    const created = await prisma.appointment.create({
      data: {
        organizationId: user.organizationId,
        patientId: dto.patientId,
        dentistUserId: dto.dentistId,
        title: dto.title,
        procedure: dto.procedure,
        notes: dto.notes,
        date,
        startTime: dto.startTime,
        endTime: dto.endTime,
        status: dto.status ?? 'PENDING',
      },
      include: {
        patient: true,
        dentist: true,
      },
    });

    return mapAppointment(created);
  }

  async updateAppointment(
    user: UserContext,
    appointmentId: string,
    dto: UpdateAppointmentDTO,
  ): Promise<ApiAppointment> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);

    const existing = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        organizationId: user.organizationId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Agendamento nao encontrado.');
    }

    const nextPatientId = dto.patientId ?? existing.patientId;
    const nextDentistId = dto.dentistId ?? existing.dentistUserId;
    const nextDate = dto.date ? normalizeDateOnly(dto.date) : existing.date;
    const nextStartTime = dto.startTime ?? existing.startTime;
    const nextEndTime = dto.endTime ?? existing.endTime;

    assertTimeRange(nextStartTime, nextEndTime);

    if (nextPatientId !== existing.patientId) {
      const patient = await prisma.paciente.findFirst({
        where: {
          id: nextPatientId,
          organizationId: user.organizationId,
          active: true,
        },
      });

      if (!patient) {
        throw new ValidationError('Paciente invalido para esta organizacao.');
      }
    }

    if (nextDentistId !== existing.dentistUserId) {
      const dentist = await prisma.user.findFirst({
        where: {
          id: nextDentistId,
          organizationId: user.organizationId,
          role: 'DENTIST',
          active: true,
        },
      });

      if (!dentist) {
        throw new ValidationError('Dentista invalido para esta organizacao.');
      }
    }

    await this.assertNoScheduleConflict(
      user.organizationId,
      nextDentistId,
      nextDate,
      nextStartTime,
      nextEndTime,
      existing.id,
    );

    const updated = await prisma.appointment.update({
      where: { id: existing.id },
      data: {
        patientId: dto.patientId,
        dentistUserId: dto.dentistId,
        title: dto.title,
        procedure: dto.procedure,
        notes: dto.notes,
        date: dto.date ? nextDate : undefined,
        startTime: dto.startTime,
        endTime: dto.endTime,
        status: dto.status,
      },
      include: {
        patient: true,
        dentist: true,
      },
    });

    return mapAppointment(updated);
  }

  async updateAppointmentStatus(
    user: UserContext,
    appointmentId: string,
    dto: UpdateAppointmentStatusDTO,
  ): Promise<ApiAppointment> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);

    const existing = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        organizationId: user.organizationId,
      },
      include: {
        patient: true,
        dentist: true,
      },
    });

    if (!existing) {
      throw new NotFoundError('Agendamento nao encontrado.');
    }

    const updated = await prisma.appointment.update({
      where: { id: existing.id },
      data: { status: dto.status },
      include: {
        patient: true,
        dentist: true,
      },
    });

    return mapAppointment(updated);
  }

  async deleteAppointment(user: UserContext, appointmentId: string): Promise<void> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);

    const existing = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        organizationId: user.organizationId,
      },
    });

    if (!existing) {
      throw new NotFoundError('Agendamento nao encontrado.');
    }

    await prisma.appointment.delete({ where: { id: existing.id } });
  }

  private async assertNoScheduleConflict(
    organizationId: string,
    dentistUserId: string,
    date: Date,
    startTime: string,
    endTime: string,
    ignoreAppointmentId?: string,
  ): Promise<void> {
    const conflicts = await prisma.appointment.findMany({
      where: {
        organizationId,
        dentistUserId,
        date,
        status: { not: 'CANCELLED' },
        id: ignoreAppointmentId ? { not: ignoreAppointmentId } : undefined,
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
      },
    });

    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);

    const hasConflict = conflicts.some((appointment) => {
      const existingStart = timeToMinutes(appointment.startTime);
      const existingEnd = timeToMinutes(appointment.endTime);
      return start < existingEnd && existingStart < end;
    });

    if (hasConflict) {
      throw new ValidationError(
        'Conflito de agenda: ja existe consulta para o dentista neste horario.',
      );
    }
  }
}
