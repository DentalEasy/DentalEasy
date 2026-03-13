import { Prisma } from '@prisma/client';
import {
  CreatePaymentDTO,
  ListPaymentsQueryDTO,
  SettlePaymentDTO,
  UpdatePaymentDTO,
} from '../DTOs';
import { prisma } from '../../Infrastructure/Persistence';
import { ensureRole } from '../../shared/access-control';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { UserContext } from '../../shared/types';
import { mapFinancialRecord, syncFinancialRecordStatus } from './financial-helpers';
import {
  ApiFinancialRecord,
  ApiPayment,
  toAmount,
} from './shared-contracts';
import { createNotification } from './notification-events';

interface PaymentWithRelations {
  id: string;
  organizationId: string;
  financialRecordId: string;
  amount: { toNumber(): number } | number;
  method: 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'BOLETO';
  status: 'PENDING' | 'SETTLED' | 'CANCELLED';
  paidAt: Date | null;
  receivedFrom: string | null;
  paidTo: string | null;
  notes: string | null;
  installmentNumber: number | null;
  totalInstallments: number | null;
  receiptNumber: string | null;
  createdByUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  financialRecord: {
    id: string;
    organizationId: string;
    description: string;
    amount: { toNumber(): number } | number;
    type: 'INCOME' | 'EXPENSE';
    category: string | null;
    paymentStatus: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED';
    paymentMethod: 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'BOLETO' | null;
    dueDate: Date;
    paidAt: Date | null;
    patientId: string | null;
    notes: string | null;
    invoiceNumber: string | null;
    fiscalDocumentRef: string | null;
    nfeStatus: 'ISSUED' | 'PENDING' | 'ERROR' | null;
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
    } | null;
    payments: Array<{
      id: string;
      amount: { toNumber(): number } | number;
      status: 'PENDING' | 'SETTLED' | 'CANCELLED';
      paidAt: Date | null;
      method: 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'BOLETO';
    }>;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'SECRETARY' | 'DENTIST';
    avatarUrl: string | null;
    organizationId: string;
  } | null;
}

export interface ApiPaymentReceipt {
  organization: {
    id: string;
    name: string;
    phone?: string;
    address?: string;
    city?: string;
    state?: string;
    cnpj?: string;
  };
  payment: ApiPayment;
  financialRecord: ApiFinancialRecord;
  issuedAt: string;
  receiptNumber: string;
  beneficiary?: string;
  payer?: string;
}

const toRounded = (value: number): number => Math.round(value * 100) / 100;

const generateReceiptNumber = (): string => {
  const date = new Date();
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}${String(date.getDate()).padStart(2, '0')}`;
  const randomPart = crypto.randomUUID().split('-')[0].toUpperCase();
  return `RCPT-${datePart}-${randomPart}`;
};

const mapPayment = (payment: PaymentWithRelations): ApiPayment => ({
  id: payment.id,
  organizationId: payment.organizationId,
  financialRecordId: payment.financialRecordId,
  amount: toAmount(payment.amount),
  method: payment.method,
  status: payment.status,
  paidAt: payment.paidAt ? payment.paidAt.toISOString() : undefined,
  receivedFrom: payment.receivedFrom ?? undefined,
  paidTo: payment.paidTo ?? undefined,
  notes: payment.notes ?? undefined,
  installmentNumber: payment.installmentNumber ?? undefined,
  totalInstallments: payment.totalInstallments ?? undefined,
  receiptNumber: payment.receiptNumber ?? undefined,
  createdByUserId: payment.createdByUserId ?? undefined,
  createdAt: payment.createdAt.toISOString(),
  updatedAt: payment.updatedAt.toISOString(),
  financialRecord: mapFinancialRecord(payment.financialRecord),
});

export class PaymentsApiUseCases {
  async listPayments(
    user: UserContext,
    query: ListPaymentsQueryDTO,
  ): Promise<ApiPayment[]> {
    ensureRole(user, ['ADMIN', 'SECRETARY']);

    const where: Prisma.PaymentWhereInput = {
      organizationId: user.organizationId,
    };

    if (query.financialRecordId) {
      where.financialRecordId = query.financialRecordId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.method) {
      where.method = query.method;
    }

    if (query.patientId) {
      where.financialRecord = {
        patientId: query.patientId,
      };
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        financialRecord: {
          include: {
            patient: true,
            payments: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map((payment) => mapPayment(payment));
  }

  async getPaymentById(user: UserContext, paymentId: string): Promise<ApiPayment> {
    ensureRole(user, ['ADMIN', 'SECRETARY']);

    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        organizationId: user.organizationId,
      },
      include: {
        financialRecord: {
          include: {
            patient: true,
            payments: true,
          },
        },
      },
    });

    if (!payment) {
      throw new NotFoundError('Pagamento nao encontrado.');
    }

    return mapPayment(payment);
  }

  async createPayment(user: UserContext, dto: CreatePaymentDTO): Promise<ApiPayment> {
    ensureRole(user, ['ADMIN', 'SECRETARY']);

    const financialRecord = await this.ensureFinancialRecord(
      user.organizationId,
      dto.financialRecordId,
    );

    this.assertInstallments(dto.installmentNumber, dto.totalInstallments);

    const status = dto.status ?? (dto.paidAt ? 'SETTLED' : 'PENDING');
    const paidAt = status === 'SETTLED' ? dto.paidAt ?? new Date() : null;

    if (status === 'SETTLED') {
      const { remainingAmount } = this.calculateBalance(financialRecord);
      if (dto.amount > remainingAmount + 0.009) {
        throw new ValidationError(
          'Valor do pagamento maior que o saldo pendente do lancamento.',
        );
      }
    }

    const created = await prisma.payment.create({
      data: {
        organizationId: user.organizationId,
        financialRecordId: dto.financialRecordId,
        amount: dto.amount,
        method: dto.method,
        status,
        paidAt,
        receivedFrom: dto.receivedFrom,
        paidTo: dto.paidTo,
        notes: dto.notes,
        installmentNumber: dto.installmentNumber,
        totalInstallments: dto.totalInstallments,
        receiptNumber: dto.receiptNumber ?? generateReceiptNumber(),
        createdByUserId: user.userId,
      },
      include: {
        financialRecord: {
          include: {
            patient: true,
            payments: true,
          },
        },
      },
    });

    await syncFinancialRecordStatus(user.organizationId, created.financialRecordId);
    const reloaded = await this.loadPayment(user.organizationId, created.id);

    if (reloaded.status === 'SETTLED') {
      await createNotification({
        organizationId: user.organizationId,
        type: 'PAYMENT',
        title: 'Pagamento recebido',
        message: `${reloaded.financialRecord.description} liquidado com sucesso.`,
        eventKey: `payment-settled:${reloaded.id}`,
        link: '/payments',
        metadata: {
          paymentId: reloaded.id,
          financialRecordId: reloaded.financialRecordId,
        },
      });
    }

    return mapPayment(reloaded);
  }

  async settlePayment(
    user: UserContext,
    paymentId: string,
    dto: SettlePaymentDTO,
  ): Promise<ApiPayment> {
    ensureRole(user, ['ADMIN', 'SECRETARY']);

    const existing = await this.loadPayment(user.organizationId, paymentId);

    const { remainingAmount } = this.calculateBalance(existing.financialRecord, existing.id);
    if (existing.status !== 'SETTLED' && toAmount(existing.amount) > remainingAmount + 0.009) {
      throw new ValidationError(
        'Nao e possivel liquidar: valor do pagamento maior que o saldo pendente.',
      );
    }

    await prisma.payment.update({
      where: { id: existing.id },
      data: {
        status: 'SETTLED',
        paidAt: dto.paidAt ?? existing.paidAt ?? new Date(),
        notes: dto.notes ?? existing.notes ?? undefined,
      },
    });

    await syncFinancialRecordStatus(user.organizationId, existing.financialRecordId);
    const reloaded = await this.loadPayment(user.organizationId, existing.id);

    await createNotification({
      organizationId: user.organizationId,
      type: 'PAYMENT',
      title: 'Pagamento recebido',
      message: `${reloaded.financialRecord.description} liquidado com sucesso.`,
      eventKey: `payment-settled:${reloaded.id}`,
      link: '/payments',
      metadata: {
        paymentId: reloaded.id,
        financialRecordId: reloaded.financialRecordId,
      },
    });

    return mapPayment(reloaded);
  }

  async updatePayment(
    user: UserContext,
    paymentId: string,
    dto: UpdatePaymentDTO,
  ): Promise<ApiPayment> {
    ensureRole(user, ['ADMIN', 'SECRETARY']);

    const existing = await this.loadPayment(user.organizationId, paymentId);
    this.assertInstallments(dto.installmentNumber, dto.totalInstallments);

    const nextStatus = dto.status ?? existing.status;
    const nextAmount = dto.amount ?? toAmount(existing.amount);
    const nextPaidAt =
      nextStatus === 'SETTLED' ? dto.paidAt ?? existing.paidAt ?? new Date() : null;

    if (nextStatus === 'SETTLED') {
      const { remainingAmount } = this.calculateBalance(
        existing.financialRecord,
        existing.id,
      );
      if (nextAmount > remainingAmount + 0.009) {
        throw new ValidationError(
          'Valor do pagamento maior que o saldo pendente do lancamento.',
        );
      }
    }

    await prisma.payment.update({
      where: { id: existing.id },
      data: {
        amount: dto.amount,
        method: dto.method,
        status: nextStatus,
        paidAt: nextPaidAt,
        receivedFrom: dto.receivedFrom,
        paidTo: dto.paidTo,
        notes: dto.notes,
        installmentNumber: dto.installmentNumber,
        totalInstallments: dto.totalInstallments,
        receiptNumber: dto.receiptNumber,
      },
    });

    await syncFinancialRecordStatus(user.organizationId, existing.financialRecordId);
    const reloaded = await this.loadPayment(user.organizationId, existing.id);
    return mapPayment(reloaded);
  }

  async getPaymentReceipt(
    user: UserContext,
    paymentId: string,
  ): Promise<ApiPaymentReceipt> {
    ensureRole(user, ['ADMIN', 'SECRETARY']);

    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        organizationId: user.organizationId,
      },
      include: {
        financialRecord: {
          include: {
            patient: true,
            payments: true,
          },
        },
        organization: true,
        createdBy: true,
      },
    });

    if (!payment) {
      throw new NotFoundError('Pagamento nao encontrado.');
    }

    const mappedPayment = mapPayment({
      ...payment,
      createdBy: payment.createdBy,
    });
    const mappedFinancialRecord = mapFinancialRecord(payment.financialRecord);
    return {
      organization: {
        id: payment.organization.id,
        name: payment.organization.nome,
        phone: payment.organization.phone ?? undefined,
        address: payment.organization.address ?? undefined,
        city: payment.organization.city ?? undefined,
        state: payment.organization.state ?? undefined,
        cnpj: payment.organization.cnpj ?? undefined,
      },
      payment: mappedPayment,
      financialRecord: mappedFinancialRecord,
      issuedAt: new Date().toISOString(),
      receiptNumber: payment.receiptNumber ?? generateReceiptNumber(),
      beneficiary:
        mappedFinancialRecord.type === 'INCOME'
          ? payment.organization.nome
          : payment.paidTo ?? undefined,
      payer:
        mappedFinancialRecord.type === 'INCOME'
          ? payment.receivedFrom ?? mappedFinancialRecord.patient?.name
          : payment.organization.nome,
    };
  }

  private async ensureFinancialRecord(
    organizationId: string,
    financialRecordId: string,
  ) {
    const record = await prisma.financialRecord.findFirst({
      where: {
        id: financialRecordId,
        organizationId,
      },
      include: {
        patient: true,
        payments: true,
      },
    });

    if (!record) {
      throw new ValidationError('Lancamento financeiro invalido para esta organizacao.');
    }

    return record;
  }

  private assertInstallments(
    installmentNumber?: number,
    totalInstallments?: number,
  ): void {
    if (installmentNumber && !totalInstallments) {
      throw new ValidationError(
        'totalInstallments e obrigatorio quando installmentNumber for informado.',
      );
    }

    if (
      installmentNumber &&
      totalInstallments &&
      installmentNumber > totalInstallments
    ) {
      throw new ValidationError(
        'installmentNumber nao pode ser maior que totalInstallments.',
      );
    }
  }

  private calculateBalance(
    financialRecord: {
      amount: { toNumber(): number } | number;
      payments: Array<{
        id: string;
        amount: { toNumber(): number } | number;
        status: 'PENDING' | 'SETTLED' | 'CANCELLED';
      }>;
    },
    ignorePaymentId?: string,
  ) {
    const totalAmount = toAmount(financialRecord.amount);
    const paidAmount = financialRecord.payments
      .filter(
        (payment) =>
          payment.status === 'SETTLED' &&
          (ignorePaymentId ? payment.id !== ignorePaymentId : true),
      )
      .reduce((sum, payment) => sum + toAmount(payment.amount), 0);

    return {
      totalAmount,
      paidAmount: toRounded(paidAmount),
      remainingAmount: toRounded(Math.max(totalAmount - paidAmount, 0)),
    };
  }

  private async loadPayment(
    organizationId: string,
    paymentId: string,
  ): Promise<PaymentWithRelations> {
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        organizationId,
      },
      include: {
        financialRecord: {
          include: {
            patient: true,
            payments: true,
          },
        },
        createdBy: true,
      },
    });

    if (!payment) {
      throw new NotFoundError('Pagamento nao encontrado.');
    }

    return payment;
  }
}
