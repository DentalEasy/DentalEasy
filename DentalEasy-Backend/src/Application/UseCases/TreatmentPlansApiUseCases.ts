import { Prisma, TreatmentPlanStatus } from '@prisma/client';
import {
  CreateTreatmentPlanDTO,
  ListTreatmentPlansQueryDTO,
  TreatmentPlanItemDTO,
  UpdateTreatmentPlanDTO,
  UpdateTreatmentPlanStatusDTO,
} from '../DTOs';
import { prisma } from '../../Infrastructure/Persistence';
import { ensureRole } from '../../shared/access-control';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { UserContext } from '../../shared/types';

export interface ApiTreatmentPlanItem {
  id: string;
  procedureId?: string;
  procedureName: string;
  category?: string;
  tooth?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

export interface ApiTreatmentPlan {
  id: string;
  organizationId: string;
  patientId: string;
  patient: {
    id: string;
    name: string;
    phone: string;
  };
  title: string;
  status: TreatmentPlanStatus;
  discount?: number;
  totalAmount: number;
  notes?: string;
  installments?: number;
  createdAt: string;
  updatedAt: string;
  items: ApiTreatmentPlanItem[];
}

const toAmount = (value: { toNumber(): number } | number): number =>
  typeof value === 'number' ? value : value.toNumber();

const toPlanItemPayload = (
  item: {
    id: string;
    procedureId: string | null;
    procedureName: string;
    category: string | null;
    tooth: string | null;
    quantity: number;
    unitPrice: { toNumber(): number } | number;
    totalPrice: { toNumber(): number } | number;
    notes: string | null;
  },
): ApiTreatmentPlanItem => ({
  id: item.id,
  procedureId: item.procedureId ?? undefined,
  procedureName: item.procedureName,
  category: item.category ?? undefined,
  tooth: item.tooth ?? undefined,
  quantity: item.quantity,
  unitPrice: toAmount(item.unitPrice),
  totalPrice: toAmount(item.totalPrice),
  notes: item.notes ?? undefined,
});

const mapTreatmentPlan = (plan: {
  id: string;
  organizationId: string;
  patientId: string;
  title: string;
  status: TreatmentPlanStatus;
  discount: { toNumber(): number } | number | null;
  totalAmount: { toNumber(): number } | number;
  notes: string | null;
  installments: number | null;
  createdAt: Date;
  updatedAt: Date;
  patient: {
    id: string;
    nome: string;
    telefone: string;
  };
  items: Array<{
    id: string;
    procedureId: string | null;
    procedureName: string;
    category: string | null;
    tooth: string | null;
    quantity: number;
    unitPrice: { toNumber(): number } | number;
    totalPrice: { toNumber(): number } | number;
    notes: string | null;
  }>;
}): ApiTreatmentPlan => ({
  id: plan.id,
  organizationId: plan.organizationId,
  patientId: plan.patientId,
  patient: {
    id: plan.patient.id,
    name: plan.patient.nome,
    phone: plan.patient.telefone,
  },
  title: plan.title,
  status: plan.status,
  discount:
    plan.discount == null ? undefined : toAmount(plan.discount),
  totalAmount: toAmount(plan.totalAmount),
  notes: plan.notes ?? undefined,
  installments: plan.installments ?? undefined,
  createdAt: plan.createdAt.toISOString(),
  updatedAt: plan.updatedAt.toISOString(),
  items: plan.items.map((item) => toPlanItemPayload(item)),
});

export class TreatmentPlansApiUseCases {
  async listTreatmentPlans(
    user: UserContext,
    query: ListTreatmentPlansQueryDTO,
  ): Promise<ApiTreatmentPlan[]> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);

    const where: Prisma.TreatmentPlanWhereInput = {
      organizationId: user.organizationId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.patientId) {
      where.patientId = query.patientId;
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { patient: { nome: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const plans = await prisma.treatmentPlan.findMany({
      where,
      include: {
        patient: true,
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return plans.map((plan) => mapTreatmentPlan(plan));
  }

  async getTreatmentPlanById(
    user: UserContext,
    treatmentPlanId: string,
  ): Promise<ApiTreatmentPlan> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);
    const plan = await this.findTreatmentPlanOrThrow(
      user.organizationId,
      treatmentPlanId,
    );
    return mapTreatmentPlan(plan);
  }

  async createTreatmentPlan(
    user: UserContext,
    dto: CreateTreatmentPlanDTO,
  ): Promise<ApiTreatmentPlan> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);
    await this.ensurePatient(user.organizationId, dto.patientId);

    const preparedItems = await this.prepareItems(
      user.organizationId,
      dto.items,
    );
    const discount = dto.discount ?? 0;
    const totalAmount = this.calculateTotalAmount(preparedItems, discount);

    const created = await prisma.treatmentPlan.create({
      data: {
        organizationId: user.organizationId,
        patientId: dto.patientId,
        createdByUserId: user.userId,
        title: dto.title ?? 'Plano de Tratamento',
        status: dto.status ?? 'DRAFT',
        discount: discount > 0 ? discount : null,
        totalAmount,
        notes: dto.notes,
        installments: dto.installments,
        items: {
          create: preparedItems,
        },
      },
      include: {
        patient: true,
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return mapTreatmentPlan(created);
  }

  async updateTreatmentPlan(
    user: UserContext,
    treatmentPlanId: string,
    dto: UpdateTreatmentPlanDTO,
  ): Promise<ApiTreatmentPlan> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);

    const existing = await this.findTreatmentPlanOrThrow(
      user.organizationId,
      treatmentPlanId,
    );

    const nextPatientId = dto.patientId ?? existing.patientId;
    if (nextPatientId !== existing.patientId) {
      await this.ensurePatient(user.organizationId, nextPatientId);
    }

    const preparedItems =
      dto.items !== undefined
        ? await this.prepareItems(user.organizationId, dto.items)
        : existing.items.map((item) => ({
            procedureId: item.procedureId,
            procedureName: item.procedureName,
            category: item.category,
            tooth: item.tooth,
            quantity: item.quantity,
            unitPrice: toAmount(item.unitPrice),
            totalPrice: toAmount(item.totalPrice),
            notes: item.notes,
          }));

    const nextDiscount =
      dto.discount ?? (existing.discount ? toAmount(existing.discount) : 0);
    const totalAmount = this.calculateTotalAmount(preparedItems, nextDiscount);

    const updated = await prisma.treatmentPlan.update({
      where: { id: existing.id },
      data: {
        patientId: dto.patientId,
        title: dto.title,
        status: dto.status,
        discount: nextDiscount > 0 ? nextDiscount : null,
        totalAmount,
        notes: dto.notes,
        installments: dto.installments,
        items:
          dto.items !== undefined
            ? {
                deleteMany: {},
                create: preparedItems,
              }
            : undefined,
      },
      include: {
        patient: true,
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return mapTreatmentPlan(updated);
  }

  async updateTreatmentPlanStatus(
    user: UserContext,
    treatmentPlanId: string,
    dto: UpdateTreatmentPlanStatusDTO,
  ): Promise<ApiTreatmentPlan> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);

    const existing = await this.findTreatmentPlanOrThrow(
      user.organizationId,
      treatmentPlanId,
    );

    const updated = await prisma.treatmentPlan.update({
      where: { id: existing.id },
      data: {
        status: dto.status,
      },
      include: {
        patient: true,
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    return mapTreatmentPlan(updated);
  }

  async deleteTreatmentPlan(
    user: UserContext,
    treatmentPlanId: string,
  ): Promise<void> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);

    const existing = await this.findTreatmentPlanOrThrow(
      user.organizationId,
      treatmentPlanId,
    );
    await prisma.treatmentPlan.delete({ where: { id: existing.id } });
  }

  private calculateTotalAmount(
    items: Array<{ totalPrice: number }>,
    discount: number,
  ): number {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    return Math.max(subtotal - discount, 0);
  }

  private async prepareItems(
    organizationId: string,
    items: TreatmentPlanItemDTO[],
  ) {
    const prepared: Array<{
      procedureId?: string;
      procedureName: string;
      category?: string;
      tooth?: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
      notes?: string;
    }> = [];

    for (const item of items) {
      let procedureName = item.procedureName;
      let category = item.category;
      let unitPrice = item.unitPrice;

      if (item.procedureId) {
        const procedure = await prisma.procedure.findFirst({
          where: {
            id: item.procedureId,
            organizationId,
          },
        });

        if (!procedure) {
          throw new ValidationError(
            'Procedimento invalido para esta organizacao.',
          );
        }

        procedureName = procedureName ?? procedure.name;
        category = category ?? procedure.category ?? undefined;
        if (item.unitPrice <= 0) {
          unitPrice = toAmount(procedure.price);
        }
      }

      if (!procedureName) {
        throw new ValidationError(
          'Informe procedureName quando procedureId nao for enviado.',
        );
      }

      const totalPrice = unitPrice * item.quantity;
      prepared.push({
        procedureId: item.procedureId,
        procedureName,
        category,
        tooth: item.tooth,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        notes: item.notes,
      });
    }

    return prepared;
  }

  private async ensurePatient(organizationId: string, patientId: string) {
    const patient = await prisma.paciente.findFirst({
      where: {
        id: patientId,
        organizationId,
        active: true,
      },
      select: { id: true },
    });

    if (!patient) {
      throw new ValidationError('Paciente invalido para esta organizacao.');
    }
  }

  private async findTreatmentPlanOrThrow(
    organizationId: string,
    treatmentPlanId: string,
  ) {
    const plan = await prisma.treatmentPlan.findFirst({
      where: {
        id: treatmentPlanId,
        organizationId,
      },
      include: {
        patient: true,
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!plan) {
      throw new NotFoundError('Plano de tratamento nao encontrado.');
    }

    return plan;
  }
}
