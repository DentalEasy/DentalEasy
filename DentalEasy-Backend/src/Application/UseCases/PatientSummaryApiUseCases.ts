import {
  AppointmentStatus,
  MedicalRecordType,
  PagamentoStatus,
  Prisma,
  TreatmentPlanStatus,
} from '@prisma/client';
import { prisma } from '../../Infrastructure/Persistence';
import { ensureRole } from '../../shared/access-control';
import { NotFoundError } from '../../shared/errors';
import { UserContext } from '../../shared/types';
import { mapFinancialRecord } from './financial-helpers';
import { ApiPatient, mapPatient, toAmount, toISODate } from './shared-contracts';

type SummarySource = 'MODERN' | 'LEGACY';
type SummaryStatusOrigin = 'EXPLICIT' | 'INFERRED';
type SummaryPaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED';
type SummaryPaymentMethod =
  | 'PIX'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'CASH'
  | 'BOLETO';

export interface ApiPatientSummaryClinicalItem {
  id: string;
  source: SummarySource;
  category: 'DIAGNOSIS' | 'TREATMENT' | 'RECORD';
  title: string;
  description: string;
  occurredAt: string;
  professionalName?: string;
  recordType?: MedicalRecordType | 'LEGACY_DIAGNOSIS' | 'LEGACY_TREATMENT';
  attachments?: string[];
}

export interface ApiPatientSummaryProcedureItem {
  id: string;
  source: SummarySource;
  title: string;
  description: string;
  occurredAt: string;
  professionalName?: string;
}

export interface ApiPatientSummaryAppointmentItem {
  id: string;
  source: SummarySource;
  status: AppointmentStatus;
  statusOrigin: SummaryStatusOrigin;
  date: string;
  startTime: string;
  endTime?: string;
  startsAt: string;
  procedure: string;
  notes?: string;
  professionalName: string;
}

export interface ApiPatientSummaryPrescriptionItem {
  id: string;
  source: SummarySource;
  createdAt: string;
  content: string;
  professionalName: string;
}

export interface ApiPatientSummaryDocumentItem {
  id: string;
  source: SummarySource;
  kind: 'ATTACHMENT' | 'PRESCRIPTION' | 'FISCAL_DOCUMENT';
  title: string;
  createdAt: string;
  professionalName?: string;
  url?: string;
  contentPreview?: string;
}

export interface ApiPatientSummaryTreatmentPlanItem {
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

export interface ApiPatientSummaryTreatmentPlan {
  id: string;
  title: string;
  status: TreatmentPlanStatus;
  discount?: number;
  totalAmount: number;
  notes?: string;
  installments?: number;
  createdAt: string;
  updatedAt: string;
  items: ApiPatientSummaryTreatmentPlanItem[];
}

export interface ApiPatientSummaryFinancialEntry {
  id: string;
  source: SummarySource;
  includeInTotals: boolean;
  description: string;
  type: 'INCOME' | 'EXPENSE';
  status: SummaryPaymentStatus;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  dueDate: string;
  paidAt?: string;
  paymentMethod?: SummaryPaymentMethod;
  notes?: string;
  invoiceNumber?: string;
  fiscalDocumentRef?: string;
  receiptNumber?: string;
  barcode?: string;
  nfeStatus?: 'ISSUED' | 'PENDING' | 'ERROR';
}

export interface ApiPatientSummaryPaymentItem {
  id: string;
  source: SummarySource;
  description: string;
  amount: number;
  status: 'PENDING' | 'SETTLED' | 'CANCELLED';
  method?: SummaryPaymentMethod;
  paidAt?: string;
  createdAt: string;
  notes?: string;
  receiptNumber?: string;
}

export interface ApiPatientSummaryPendingItem {
  id: string;
  source: SummarySource;
  kind: 'APPOINTMENT' | 'FINANCIAL' | 'TREATMENT_PLAN' | 'ALERT';
  title: string;
  description: string;
  status: string;
  dueAt?: string;
}

export interface ApiPatientSummary {
  patient: ApiPatient;
  chart: {
    id?: string;
    clinicalAccessGranted: boolean;
    diagnoses: ApiPatientSummaryClinicalItem[];
    treatments: ApiPatientSummaryClinicalItem[];
    records: ApiPatientSummaryClinicalItem[];
    timeline: ApiPatientSummaryClinicalItem[];
  };
  appointments: {
    total: number;
    upcoming: ApiPatientSummaryAppointmentItem[];
    past: ApiPatientSummaryAppointmentItem[];
    pendingCount: number;
    nextAppointmentAt?: string;
    lastAppointmentAt?: string;
  };
  procedures: {
    totalPerformed: number;
    items: ApiPatientSummaryProcedureItem[];
  };
  prescriptions: {
    total: number;
    items: ApiPatientSummaryPrescriptionItem[];
  };
  documents: {
    total: number;
    items: ApiPatientSummaryDocumentItem[];
  };
  treatmentPlans: {
    total: number;
    active: number;
    items: ApiPatientSummaryTreatmentPlan[];
  };
  financial: {
    entries: ApiPatientSummaryFinancialEntry[];
    payments: ApiPatientSummaryPaymentItem[];
    totals: {
      generatedRevenue: number;
      patientLinkedCosts: number;
      trackedProfit: number;
      totalPaid: number;
      totalPending: number;
      totalOverdue: number;
      totalOutstanding: number;
      entryCount: number;
      paymentCount: number;
    };
  };
  pendingItems: ApiPatientSummaryPendingItem[];
  indicators: {
    appointmentsTotal: number;
    upcomingAppointments: number;
    completedAppointments: number;
    totalClinicalEntries: number;
    totalDocuments: number;
    totalProcedures: number;
    activeTreatmentPlans: number;
    prescriptionsIssued: number;
    pendingFinancialEntries: number;
    overdueFinancialEntries: number;
    nextAppointmentAt?: string;
    lastAppointmentAt?: string;
    lastClinicalEntryAt?: string;
    lastPaymentAt?: string;
  };
}

const EMPTY_CLINICAL_SECTIONS = {
  diagnoses: [] as ApiPatientSummaryClinicalItem[],
  treatments: [] as ApiPatientSummaryClinicalItem[],
  records: [] as ApiPatientSummaryClinicalItem[],
  timeline: [] as ApiPatientSummaryClinicalItem[],
  procedures: [] as ApiPatientSummaryProcedureItem[],
  prescriptions: [] as ApiPatientSummaryPrescriptionItem[],
  documents: [] as ApiPatientSummaryDocumentItem[],
};

const roundAmount = (value: number): number => Math.round(value * 100) / 100;

const toIsoDateTime = (value: Date): string => value.toISOString();

const toTime = (value: Date): string => value.toISOString().slice(11, 16);

const statusFromLegacyPayment = (
  status: PagamentoStatus,
): SummaryPaymentStatus => {
  if (status === 'PAGO') {
    return 'PAID';
  }

  if (status === 'CANCELADO') {
    return 'CANCELLED';
  }

  return 'PENDING';
};

const normalizeAttachments = (
  value: Prisma.JsonValue | null,
): string[] | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const attachments = value
    .map((item) => (typeof item === 'string' ? item : ''))
    .filter(Boolean);

  return attachments.length > 0 ? attachments : undefined;
};

const sortByOccurredAtDesc = <T extends { occurredAt: string }>(items: T[]): T[] =>
  [...items].sort(
    (left, right) =>
      new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
  );

const sortByCreatedAtDesc = <T extends { createdAt: string }>(items: T[]): T[] =>
  [...items].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );

const sortAppointmentsAsc = (
  items: ApiPatientSummaryAppointmentItem[],
): ApiPatientSummaryAppointmentItem[] =>
  [...items].sort(
    (left, right) =>
      new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
  );

const sortAppointmentsDesc = (
  items: ApiPatientSummaryAppointmentItem[],
): ApiPatientSummaryAppointmentItem[] =>
  [...items].sort(
    (left, right) =>
      new Date(right.startsAt).getTime() - new Date(left.startsAt).getTime(),
  );

const patientSummaryQuery = Prisma.validator<Prisma.PacienteDefaultArgs>()({
  include: {
    prontuario: {
      include: {
        tratamentos: {
          orderBy: { data: 'desc' },
        },
        diagnosticos: {
          orderBy: { data: 'desc' },
        },
      },
    },
    consultas: {
      include: {
        dentista: true,
      },
      orderBy: { dataHora: 'desc' },
    },
    receitas: {
      include: {
        dentista: true,
      },
      orderBy: { createdAt: 'desc' },
    },
    pagamentos: {
      include: {
        boleto: true,
        notaFiscal: true,
      },
      orderBy: { createdAt: 'desc' },
    },
    appointments: {
      include: {
        dentist: true,
      },
      orderBy: [{ date: 'desc' }, { startTime: 'desc' }],
    },
    medicalRecords: {
      include: {
        dentist: true,
      },
      orderBy: { createdAt: 'desc' },
    },
    prescriptions: {
      include: {
        dentist: true,
      },
      orderBy: { createdAt: 'desc' },
    },
    financialRecords: {
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
    },
    treatmentPlans: {
      include: {
        items: {
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    },
  },
});

export class PatientSummaryApiUseCases {
  async getPatientSummary(
    user: UserContext,
    patientId: string,
  ): Promise<ApiPatientSummary> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);

    const canViewClinicalDetails =
      user.role === 'ADMIN' || user.role === 'DENTIST';

    const patientExists = await prisma.paciente.findFirst({
      where: {
        id: patientId,
        organizationId: user.organizationId,
      },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!patientExists) {
      throw new NotFoundError('Paciente nao encontrado.');
    }

    await this.ensurePatientChart(patientExists.organizationId, patientExists.id);

    const patient = await prisma.paciente.findFirst({
      ...patientSummaryQuery,
      where: {
        id: patientId,
        organizationId: user.organizationId,
      },
    });

    if (!patient) {
      throw new NotFoundError('Paciente nao encontrado.');
    }

    const now = new Date();
    const modernFinancialEntries = patient.financialRecords.map((record) => {
      const mapped = mapFinancialRecord(record);
      return {
        id: mapped.id,
        source: 'MODERN' as const,
        includeInTotals: true,
        description: mapped.description,
        type: mapped.type,
        status: mapped.paymentStatus,
        amount: mapped.amount,
        paidAmount: mapped.paidAmount,
        remainingAmount: mapped.remainingAmount,
        dueDate: mapped.dueDate,
        paidAt: mapped.paidAt,
        paymentMethod: mapped.paymentMethod as SummaryPaymentMethod | undefined,
        notes: mapped.notes,
        invoiceNumber: mapped.invoiceNumber,
        fiscalDocumentRef: mapped.fiscalDocumentRef,
        nfeStatus: mapped.nfeStatus,
      };
    });

    const countLegacyFinancialInTotals = modernFinancialEntries.length === 0;
    const legacyFinancialEntries = patient.pagamentos.map((payment) => {
      const status = statusFromLegacyPayment(payment.status);
      const amount = toAmount(payment.valor);
      const dueDate = payment.boleto?.vencimento ?? payment.createdAt;
      const paidAt = status === 'PAID' ? payment.updatedAt : undefined;
      const paidAmount = status === 'PAID' ? amount : 0;
      const remainingAmount =
        status === 'PENDING' ? amount : 0;

      return {
        id: payment.id,
        source: 'LEGACY' as const,
        includeInTotals: countLegacyFinancialInTotals,
        description: payment.notaFiscal
          ? `Pagamento legado NF ${payment.notaFiscal.numero}`
          : 'Pagamento legado do paciente',
        type: 'INCOME' as const,
        status,
        amount,
        paidAmount,
        remainingAmount,
        dueDate: toISODate(dueDate),
        paidAt: paidAt ? paidAt.toISOString() : undefined,
        paymentMethod: payment.boleto ? ('BOLETO' as const) : undefined,
        notes: payment.notaFiscal?.chaveAcesso ?? undefined,
        invoiceNumber: payment.notaFiscal?.numero ?? undefined,
        fiscalDocumentRef: payment.notaFiscal?.chaveAcesso ?? undefined,
        receiptNumber: payment.notaFiscal?.numero ?? undefined,
        barcode: payment.boleto?.codigoBarras ?? undefined,
      };
    });

    const financialEntries = [...modernFinancialEntries, ...legacyFinancialEntries].sort(
      (left, right) => {
        const leftDate = new Date(left.paidAt ?? `${left.dueDate}T00:00:00.000Z`).getTime();
        const rightDate = new Date(right.paidAt ?? `${right.dueDate}T00:00:00.000Z`).getTime();
        return rightDate - leftDate;
      },
    );

    const financialPayments = [
      ...patient.financialRecords.flatMap((record) =>
        record.payments.map((payment) => ({
          id: payment.id,
          source: 'MODERN' as const,
          description: record.description,
          amount: toAmount(payment.amount),
          status: payment.status,
          method: payment.method,
          paidAt: payment.paidAt ? payment.paidAt.toISOString() : undefined,
          createdAt: payment.createdAt.toISOString(),
          notes: payment.notes ?? undefined,
          receiptNumber: payment.receiptNumber ?? undefined,
        })),
      ),
      ...patient.pagamentos.map((payment) => ({
        id: payment.id,
        source: 'LEGACY' as const,
        description: payment.notaFiscal
          ? `Pagamento legado NF ${payment.notaFiscal.numero}`
          : 'Pagamento legado do paciente',
        amount: toAmount(payment.valor),
        status:
          payment.status === 'PAGO'
            ? ('SETTLED' as const)
            : payment.status === 'CANCELADO'
            ? ('CANCELLED' as const)
            : ('PENDING' as const),
        method: payment.boleto ? ('BOLETO' as const) : undefined,
        paidAt: payment.status === 'PAGO' ? payment.updatedAt.toISOString() : undefined,
        createdAt: payment.createdAt.toISOString(),
        notes: payment.notaFiscal?.chaveAcesso ?? undefined,
        receiptNumber: payment.notaFiscal?.numero ?? undefined,
      })),
    ].sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    );

    const modernAppointments = patient.appointments.map((appointment) => ({
      id: appointment.id,
      source: 'MODERN' as const,
      status: appointment.status,
      statusOrigin: 'EXPLICIT' as const,
      date: toISODate(appointment.date),
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      startsAt: `${toISODate(appointment.date)}T${appointment.startTime}:00.000Z`,
      procedure: appointment.procedure ?? appointment.title ?? 'Consulta',
      notes: appointment.notes ?? undefined,
      professionalName: appointment.dentist.name,
    }));

    const legacyAppointments = patient.consultas.map((appointment) => {
      const startsAt = toIsoDateTime(appointment.dataHora);
      return {
        id: appointment.id,
        source: 'LEGACY' as const,
        status:
          appointment.dataHora.getTime() >= now.getTime()
            ? ('CONFIRMED' as const)
            : ('COMPLETED' as const),
        statusOrigin: 'INFERRED' as const,
        date: toISODate(appointment.dataHora),
        startTime: toTime(appointment.dataHora),
        endTime: undefined,
        startsAt,
        procedure: 'Consulta',
        notes: appointment.observacoes ?? undefined,
        professionalName: appointment.dentista.nome,
      };
    });

    const allAppointments = sortAppointmentsAsc([
      ...modernAppointments,
      ...legacyAppointments,
    ]);
    const upcomingAppointments = allAppointments.filter(
      (appointment) =>
        new Date(appointment.startsAt).getTime() >= now.getTime() &&
        appointment.status !== 'CANCELLED',
    );
    const pastAppointments = sortAppointmentsDesc(
      allAppointments.filter(
        (appointment) =>
          new Date(appointment.startsAt).getTime() < now.getTime() ||
          appointment.status === 'COMPLETED' ||
          appointment.status === 'CANCELLED',
      ),
    );

    const diagnoses = patient.prontuario?.diagnosticos.map((diagnosis) => ({
      id: diagnosis.id,
      source: 'LEGACY' as const,
      category: 'DIAGNOSIS' as const,
      title: 'Diagnostico',
      description: diagnosis.descricao,
      occurredAt: diagnosis.data.toISOString(),
      recordType: 'LEGACY_DIAGNOSIS' as const,
    })) ?? [];

    const treatments = patient.prontuario?.tratamentos.map((treatment) => ({
      id: treatment.id,
      source: 'LEGACY' as const,
      category: 'TREATMENT' as const,
      title: 'Tratamento',
      description: treatment.descricao,
      occurredAt: treatment.data.toISOString(),
      recordType: 'LEGACY_TREATMENT' as const,
    })) ?? [];

    const records = canViewClinicalDetails
      ? patient.medicalRecords?.map((record) => ({
          id: record.id,
          source: 'MODERN' as const,
          category: 'RECORD' as const,
          title: record.title,
          description: record.description,
          occurredAt: record.createdAt.toISOString(),
          professionalName: record.dentist.name,
          recordType: record.type,
          attachments: normalizeAttachments(record.attachments),
        })) ?? []
      : EMPTY_CLINICAL_SECTIONS.records;

    const procedureItems = canViewClinicalDetails
      ? sortByOccurredAtDesc([
          ...(patient.medicalRecords
            ?.filter((record) => record.type === 'PROCEDURE')
            .map((record) => ({
              id: record.id,
              source: 'MODERN' as const,
              title: record.title,
              description: record.description,
              occurredAt: record.createdAt.toISOString(),
              professionalName: record.dentist.name,
            })) ?? []),
          ...treatments.map((treatment) => ({
            id: treatment.id,
            source: 'LEGACY' as const,
            title: treatment.title,
            description: treatment.description,
            occurredAt: treatment.occurredAt,
            professionalName: undefined,
          })),
        ])
      : EMPTY_CLINICAL_SECTIONS.procedures;

    const prescriptionItems = canViewClinicalDetails
      ? sortByCreatedAtDesc([
          ...(patient.prescriptions?.map((prescription) => ({
            id: prescription.id,
            source: 'MODERN' as const,
            createdAt: prescription.createdAt.toISOString(),
            content: prescription.content,
            professionalName: prescription.dentist.name,
          })) ?? []),
          ...patient.receitas.map((prescription) => ({
            id: prescription.id,
            source: 'LEGACY' as const,
            createdAt: prescription.createdAt.toISOString(),
            content: prescription.conteudo,
            professionalName: prescription.dentista.nome,
          })),
        ])
      : EMPTY_CLINICAL_SECTIONS.prescriptions;

    const documents = canViewClinicalDetails
      ? sortByCreatedAtDesc([
          ...(patient.medicalRecords?.flatMap((record) => {
            const attachments = normalizeAttachments(record.attachments) ?? [];
            return attachments.map((attachment, index) => ({
              id: `${record.id}-attachment-${index}`,
              source: 'MODERN' as const,
              kind: 'ATTACHMENT' as const,
              title: attachment.split('/').pop() ?? attachment,
              createdAt: record.createdAt.toISOString(),
              professionalName: record.dentist.name,
              url: attachment,
              contentPreview: record.title,
            }));
          }) ?? []),
          ...prescriptionItems.map((prescription) => ({
            id: `${prescription.id}-prescription`,
            source: prescription.source,
            kind: 'PRESCRIPTION' as const,
            title: 'Receita emitida',
            createdAt: prescription.createdAt,
            professionalName: prescription.professionalName,
            contentPreview: prescription.content,
          })),
          ...legacyFinancialEntries
            .filter((entry) => entry.invoiceNumber || entry.barcode)
            .map((entry) => ({
              id: `${entry.id}-fiscal`,
              source: entry.source,
              kind: 'FISCAL_DOCUMENT' as const,
              title: entry.invoiceNumber
                ? `Documento fiscal ${entry.invoiceNumber}`
                : 'Documento financeiro legado',
              createdAt: entry.paidAt ?? `${entry.dueDate}T00:00:00.000Z`,
              contentPreview: entry.barcode ?? entry.fiscalDocumentRef,
            })),
        ])
      : EMPTY_CLINICAL_SECTIONS.documents;

    const treatmentPlans = patient.treatmentPlans.map((plan) => ({
      id: plan.id,
      title: plan.title,
      status: plan.status,
      discount:
        plan.discount == null ? undefined : toAmount(plan.discount),
      totalAmount: toAmount(plan.totalAmount),
      notes: plan.notes ?? undefined,
      installments: plan.installments ?? undefined,
      createdAt: plan.createdAt.toISOString(),
      updatedAt: plan.updatedAt.toISOString(),
      items: plan.items.map((item) => ({
        id: item.id,
        procedureId: item.procedureId ?? undefined,
        procedureName: item.procedureName,
        category: item.category ?? undefined,
        tooth: item.tooth ?? undefined,
        quantity: item.quantity,
        unitPrice: toAmount(item.unitPrice),
        totalPrice: toAmount(item.totalPrice),
        notes: item.notes ?? undefined,
      })),
    }));

    const chartTimeline = sortByOccurredAtDesc([
      ...diagnoses,
      ...treatments,
      ...records,
    ]);

    const countedFinancialEntries = financialEntries.filter(
      (entry) => entry.includeInTotals,
    );
    const generatedRevenue = roundAmount(
      countedFinancialEntries
        .filter((entry) => entry.type === 'INCOME')
        .reduce((sum, entry) => sum + entry.amount, 0),
    );
    const patientLinkedCosts = roundAmount(
      countedFinancialEntries
        .filter((entry) => entry.type === 'EXPENSE')
        .reduce((sum, entry) => sum + entry.amount, 0),
    );
    const totalPaid = roundAmount(
      countedFinancialEntries
        .filter((entry) => entry.type === 'INCOME')
        .reduce((sum, entry) => sum + entry.paidAmount, 0),
    );
    const totalPending = roundAmount(
      countedFinancialEntries
        .filter(
          (entry) => entry.type === 'INCOME' && entry.status === 'PENDING',
        )
        .reduce((sum, entry) => sum + entry.remainingAmount, 0),
    );
    const totalOverdue = roundAmount(
      countedFinancialEntries
        .filter(
          (entry) => entry.type === 'INCOME' && entry.status === 'OVERDUE',
        )
        .reduce((sum, entry) => sum + entry.remainingAmount, 0),
    );
    const trackedProfit = roundAmount(generatedRevenue - patientLinkedCosts);

    const pendingItems: ApiPatientSummaryPendingItem[] = [
      ...upcomingAppointments
        .filter((appointment) => appointment.status === 'PENDING')
        .map((appointment) => ({
          id: `appointment-${appointment.id}`,
          source: appointment.source,
          kind: 'APPOINTMENT' as const,
          title: 'Consulta pendente',
          description: `${appointment.procedure} com ${appointment.professionalName}`,
          status: appointment.status,
          dueAt: appointment.startsAt,
        })),
      ...countedFinancialEntries
        .filter(
          (entry) =>
            entry.type === 'INCOME' &&
            (entry.status === 'PENDING' || entry.status === 'OVERDUE') &&
            entry.remainingAmount > 0,
        )
        .map((entry) => ({
          id: `financial-${entry.id}`,
          source: entry.source,
          kind: 'FINANCIAL' as const,
          title:
            entry.status === 'OVERDUE'
              ? 'Pagamento em atraso'
              : 'Pagamento pendente',
          description: `${entry.description} - saldo ${entry.remainingAmount.toFixed(2)}`,
          status: entry.status,
          dueAt: `${entry.dueDate}T00:00:00.000Z`,
        })),
      ...treatmentPlans
        .filter((plan) => ['DRAFT', 'SENT', 'IN_PROGRESS'].includes(plan.status))
        .map((plan) => ({
          id: `plan-${plan.id}`,
          source: 'MODERN' as const,
          kind: 'TREATMENT_PLAN' as const,
          title: 'Plano em aberto',
          description: plan.title,
          status: plan.status,
          dueAt: plan.updatedAt,
        })),
      ...(patient.serasaStatus === 'GREEN'
        ? []
        : [
            {
              id: `alert-serasa-${patient.id}`,
              source: 'MODERN' as const,
              kind: 'ALERT' as const,
              title: 'Atencao financeira do paciente',
              description:
                patient.serasaStatus === 'RED'
                  ? 'Paciente com pendencia financeira sinalizada.'
                  : 'Paciente requer acompanhamento financeiro.',
              status: patient.serasaStatus,
              dueAt: undefined,
            },
          ]),
    ].sort((left, right) => {
      const leftDate = left.dueAt ? new Date(left.dueAt).getTime() : 0;
      const rightDate = right.dueAt ? new Date(right.dueAt).getTime() : 0;
      return rightDate - leftDate;
    });

    const nextAppointmentAt = upcomingAppointments[0]?.startsAt;
    const lastAppointmentAt = pastAppointments[0]?.startsAt;
    const lastClinicalEntryAt = chartTimeline[0]?.occurredAt;
    const lastPaymentAt = financialPayments.find((payment) => payment.paidAt)?.paidAt;

    return {
      patient: mapPatient(patient),
      chart: {
        id: patient.prontuario?.id,
        clinicalAccessGranted: canViewClinicalDetails,
        diagnoses: diagnoses,
        treatments: treatments,
        records: records,
        timeline: chartTimeline,
      },
      appointments: {
        total: allAppointments.length,
        upcoming: upcomingAppointments,
        past: pastAppointments,
        pendingCount: upcomingAppointments.filter(
          (appointment) => appointment.status === 'PENDING',
        ).length,
        nextAppointmentAt,
        lastAppointmentAt,
      },
      procedures: {
        totalPerformed: procedureItems.length,
        items: procedureItems,
      },
      prescriptions: {
        total: prescriptionItems.length,
        items: prescriptionItems,
      },
      documents: {
        total: documents.length,
        items: documents,
      },
      treatmentPlans: {
        total: treatmentPlans.length,
        active: treatmentPlans.filter(
          (plan) => !['COMPLETED', 'CANCELED', 'REJECTED'].includes(plan.status),
        ).length,
        items: treatmentPlans,
      },
      financial: {
        entries: financialEntries,
        payments: financialPayments,
        totals: {
          generatedRevenue,
          patientLinkedCosts,
          trackedProfit,
          totalPaid,
          totalPending,
          totalOverdue,
          totalOutstanding: roundAmount(totalPending + totalOverdue),
          entryCount: financialEntries.length,
          paymentCount: financialPayments.length,
        },
      },
      pendingItems,
      indicators: {
        appointmentsTotal: allAppointments.length,
        upcomingAppointments: upcomingAppointments.length,
        completedAppointments: pastAppointments.filter(
          (appointment) => appointment.status === 'COMPLETED',
        ).length,
        totalClinicalEntries: chartTimeline.length,
        totalDocuments: documents.length,
        totalProcedures: procedureItems.length,
        activeTreatmentPlans: treatmentPlans.filter(
          (plan) => !['COMPLETED', 'CANCELED', 'REJECTED'].includes(plan.status),
        ).length,
        prescriptionsIssued: prescriptionItems.length,
        pendingFinancialEntries: countedFinancialEntries.filter(
          (entry) => entry.type === 'INCOME' && entry.status === 'PENDING',
        ).length,
        overdueFinancialEntries: countedFinancialEntries.filter(
          (entry) => entry.type === 'INCOME' && entry.status === 'OVERDUE',
        ).length,
        nextAppointmentAt,
        lastAppointmentAt,
        lastClinicalEntryAt,
        lastPaymentAt,
      },
    };
  }

  private async ensurePatientChart(
    organizationId: string,
    patientId: string,
  ): Promise<void> {
    await prisma.prontuario.upsert({
      where: {
        pacienteId: patientId,
      },
      update: {},
      create: {
        organizationId,
        pacienteId: patientId,
      },
    });
  }
}
