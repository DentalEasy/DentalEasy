import { Prisma } from '@prisma/client';
import {
  CreateFinancialRecordDTO,
  ListFinancialRecordsQueryDTO,
  UpdateFinancialRecordDTO,
} from '../DTOs';
import { prisma } from '../../Infrastructure/Persistence';
import { ensureRole } from '../../shared/access-control';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { UserContext } from '../../shared/types';
import {
  mapFinancialRecord,
  refreshOverdueFinancialRecords,
} from './financial-helpers';
import { ApiFinancialRecord } from './shared-contracts';
import { createNotification } from './notification-events';

const parseQueryDate = (value: string | undefined, fieldName: string): Date | undefined => {
  if (!value) {
    return undefined;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime())) {
    throw new ValidationError(`Parametro ${fieldName} invalido.`);
  }

  return parsed;
};

const todayStart = (): Date => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

export class FinancialRecordsApiUseCases {
  async listFinancialRecords(
    user: UserContext,
    query: ListFinancialRecordsQueryDTO,
  ): Promise<ApiFinancialRecord[]> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);
    await refreshOverdueFinancialRecords(user.organizationId);

    const where: Prisma.FinancialRecordWhereInput = {
      organizationId: user.organizationId,
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.paymentStatus) {
      where.paymentStatus = query.paymentStatus;
    }

    if (query.category) {
      where.category = {
        contains: query.category,
        mode: 'insensitive',
      };
    }

    if (query.patientId) {
      where.patientId = query.patientId;
    }

    const dueDateFrom = parseQueryDate(query.dueDateFrom, 'dueDateFrom');
    const dueDateTo = parseQueryDate(query.dueDateTo, 'dueDateTo');
    if (dueDateFrom || dueDateTo) {
      where.dueDate = {
        gte: dueDateFrom,
        lte: dueDateTo,
      };
    }

    const periodFrom = parseQueryDate(query.periodFrom, 'periodFrom');
    const periodTo = parseQueryDate(query.periodTo, 'periodTo');
    if (periodFrom || periodTo) {
      where.createdAt = {
        gte: periodFrom,
        lte: periodTo,
      };
    }

    const records = await prisma.financialRecord.findMany({
      where,
      include: {
        patient: true,
        payments: true,
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });

    return records.map((record) => mapFinancialRecord(record));
  }

  async getFinancialRecordById(
    user: UserContext,
    financialRecordId: string,
  ): Promise<ApiFinancialRecord> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);
    await refreshOverdueFinancialRecords(user.organizationId);

    const record = await prisma.financialRecord.findFirst({
      where: {
        id: financialRecordId,
        organizationId: user.organizationId,
      },
      include: {
        patient: true,
        payments: true,
      },
    });

    if (!record) {
      throw new NotFoundError('Lancamento financeiro nao encontrado.');
    }

    return mapFinancialRecord(record);
  }

  async createFinancialRecord(
    user: UserContext,
    dto: CreateFinancialRecordDTO,
  ): Promise<ApiFinancialRecord> {
    ensureRole(user, ['ADMIN', 'SECRETARY']);

    if (dto.patientId) {
      await this.ensurePatientFromOrganization(user.organizationId, dto.patientId);
    }

    let paymentStatus = dto.paymentStatus ?? 'PENDING';
    let paidAt = dto.paidAt;

    if (paidAt && !dto.paymentStatus) {
      paymentStatus = 'PAID';
    }

    if (paymentStatus === 'PAID' && !paidAt) {
      paidAt = new Date();
    }

    if (
      !dto.paymentStatus &&
      !paidAt &&
      dto.dueDate < todayStart() &&
      paymentStatus !== 'CANCELLED'
    ) {
      paymentStatus = 'OVERDUE';
    }

    const created = await prisma.financialRecord.create({
      data: {
        organizationId: user.organizationId,
        patientId: dto.patientId,
        description: dto.description,
        amount: dto.amount,
        type: dto.type,
        category: dto.category,
        paymentStatus,
        paymentMethod: dto.paymentMethod,
        dueDate: dto.dueDate,
        paidAt,
        notes: dto.notes,
        invoiceNumber: dto.invoiceNumber,
        fiscalDocumentRef: dto.fiscalDocumentRef,
        nfeStatus: dto.nfeStatus,
      },
      include: {
        patient: true,
        payments: true,
      },
    });

    if (created.paymentStatus === 'PENDING' || created.paymentStatus === 'OVERDUE') {
      await createNotification({
        organizationId: user.organizationId,
        type: 'PAYMENT',
        title:
          created.paymentStatus === 'OVERDUE'
            ? 'Pagamento vencido'
            : 'Pagamento pendente',
        message: `${created.description} em aberto para acompanhamento financeiro.`,
        eventKey: `financial-record:${created.id}:${created.paymentStatus}`,
        link: '/financial',
        metadata: {
          financialRecordId: created.id,
        },
      });
    }

    return mapFinancialRecord(created);
  }

  async updateFinancialRecord(
    user: UserContext,
    financialRecordId: string,
    dto: UpdateFinancialRecordDTO,
  ): Promise<ApiFinancialRecord> {
    ensureRole(user, ['ADMIN', 'SECRETARY']);

    const existing = await prisma.financialRecord.findFirst({
      where: {
        id: financialRecordId,
        organizationId: user.organizationId,
      },
      include: {
        patient: true,
        payments: true,
      },
    });

    if (!existing) {
      throw new NotFoundError('Lancamento financeiro nao encontrado.');
    }

    if (dto.patientId) {
      await this.ensurePatientFromOrganization(user.organizationId, dto.patientId);
    }

    const nextDueDate = dto.dueDate ?? existing.dueDate;
    let paymentStatus = dto.paymentStatus ?? existing.paymentStatus;
    let paidAt = dto.paidAt ?? existing.paidAt;

    if (dto.paidAt && !dto.paymentStatus) {
      paymentStatus = 'PAID';
    }

    if (paymentStatus === 'PAID' && !paidAt) {
      paidAt = new Date();
    }

    if (dto.paymentStatus && dto.paymentStatus !== 'PAID' && !dto.paidAt) {
      paidAt = null;
    }

    if (
      !dto.paymentStatus &&
      paymentStatus !== 'PAID' &&
      paymentStatus !== 'CANCELLED' &&
      !paidAt &&
      nextDueDate < todayStart()
    ) {
      paymentStatus = 'OVERDUE';
    }

    const updated = await prisma.financialRecord.update({
      where: { id: existing.id },
      data: {
        patientId: dto.patientId,
        description: dto.description,
        amount: dto.amount,
        type: dto.type,
        category: dto.category,
        paymentStatus,
        paymentMethod: dto.paymentMethod,
        dueDate: dto.dueDate,
        paidAt,
        notes: dto.notes,
        invoiceNumber: dto.invoiceNumber,
        fiscalDocumentRef: dto.fiscalDocumentRef,
        nfeStatus: dto.nfeStatus,
      },
      include: {
        patient: true,
        payments: true,
      },
    });

    if (updated.paymentStatus === 'PENDING' || updated.paymentStatus === 'OVERDUE') {
      await createNotification({
        organizationId: user.organizationId,
        type: 'PAYMENT',
        title:
          updated.paymentStatus === 'OVERDUE'
            ? 'Pagamento vencido'
            : 'Pagamento pendente',
        message: `${updated.description} em aberto para acompanhamento financeiro.`,
        eventKey: `financial-record:${updated.id}:${updated.paymentStatus}`,
        link: '/financial',
        metadata: {
          financialRecordId: updated.id,
        },
      });
    }

    return mapFinancialRecord(updated);
  }

  async deleteFinancialRecord(user: UserContext, financialRecordId: string): Promise<void> {
    ensureRole(user, ['ADMIN', 'SECRETARY']);

    const existing = await prisma.financialRecord.findFirst({
      where: {
        id: financialRecordId,
        organizationId: user.organizationId,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundError('Lancamento financeiro nao encontrado.');
    }

    await prisma.financialRecord.delete({
      where: { id: existing.id },
    });
  }

  private async ensurePatientFromOrganization(
    organizationId: string,
    patientId: string,
  ): Promise<void> {
    const patient = await prisma.paciente.findFirst({
      where: {
        id: patientId,
        organizationId,
      },
      select: { id: true },
    });

    if (!patient) {
      throw new ValidationError('Paciente invalido para esta organizacao.');
    }
  }
}
