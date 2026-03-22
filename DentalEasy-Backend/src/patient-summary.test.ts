import assert from 'node:assert/strict';
import { PatientSummaryApiUseCases } from './Application/UseCases/PatientSummaryApiUseCases';
import { prisma } from './Infrastructure/Persistence';
import type { UserContext } from './shared/types';

type RestoreFn = () => void;

const user: UserContext = {
  userId: 'user-1',
  organizationId: 'org-1',
  role: 'ADMIN',
  sessionId: 'session-1',
  tokenId: 'token-1',
};

const patchMethod = <T extends object, K extends keyof T>(
  object: T,
  method: K,
  implementation: T[K],
): RestoreFn => {
  const original = object[method];
  object[method] = implementation;
  return () => {
    object[method] = original;
  };
};

const createBasePatient = () => ({
  id: 'patient-1',
  organizationId: 'org-1',
  nome: 'Joao da Silva',
  cpf: '12345678900',
  dataNascimento: new Date('1990-01-10T00:00:00.000Z'),
  email: 'joao@teste.com',
  telefone: '17999999999',
  endereco: 'Rua Central, 100',
  avatarUrl: null,
  serasaStatus: 'GREEN' as const,
  alergias: 'Penicilina',
  observacoesMedicas: 'Paciente exige acompanhamento periodontal.',
  active: true,
  createdAt: new Date('2025-01-01T00:00:00.000Z'),
  updatedAt: new Date('2025-01-10T00:00:00.000Z'),
});

const run = async () => {
  const useCases = new PatientSummaryApiUseCases();
  let passed = 0;
  let failed = 0;

  const test = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
      passed += 1;
      console.log(`PASS ${name}`);
    } catch (error) {
      failed += 1;
      console.error(`FAIL ${name}`);
      console.error(error);
    }
  };

  await test('aggregates modern clinical and financial data under patient context', async () => {
    const patient = {
      ...createBasePatient(),
      prontuario: {
        id: 'chart-1',
        organizationId: 'org-1',
        pacienteId: 'patient-1',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-10T00:00:00.000Z'),
        diagnosticos: [
          {
            id: 'diag-1',
            prontuarioId: 'chart-1',
            descricao: 'Gengivite leve.',
            data: new Date('2025-02-01T10:00:00.000Z'),
          },
        ],
        tratamentos: [
          {
            id: 'legacy-treatment-1',
            prontuarioId: 'chart-1',
            descricao: 'Aplicacao de fluor.',
            data: new Date('2025-02-03T10:00:00.000Z'),
          },
        ],
      },
      consultas: [],
      receitas: [],
      pagamentos: [],
      appointments: [
        {
          id: 'app-future',
          organizationId: 'org-1',
          patientId: 'patient-1',
          dentistUserId: 'dentist-1',
          title: 'Retorno',
          procedure: 'Avaliacao',
          notes: 'Trazer exames.',
          date: new Date('2099-01-10T00:00:00.000Z'),
          startTime: '09:30',
          endTime: '10:00',
          status: 'PENDING' as const,
          reminderSent: false,
          createdAt: new Date('2025-02-10T00:00:00.000Z'),
          updatedAt: new Date('2025-02-10T00:00:00.000Z'),
          dentist: {
            id: 'dentist-1',
            name: 'Dra. Paula',
            email: 'paula@teste.com',
            role: 'DENTIST' as const,
            avatarUrl: null,
            organizationId: 'org-1',
          },
        },
        {
          id: 'app-past',
          organizationId: 'org-1',
          patientId: 'patient-1',
          dentistUserId: 'dentist-1',
          title: null,
          procedure: 'Limpeza',
          notes: null,
          date: new Date('2024-12-01T00:00:00.000Z'),
          startTime: '08:00',
          endTime: '09:00',
          status: 'COMPLETED' as const,
          reminderSent: true,
          createdAt: new Date('2024-11-20T00:00:00.000Z'),
          updatedAt: new Date('2024-12-01T00:00:00.000Z'),
          dentist: {
            id: 'dentist-1',
            name: 'Dra. Paula',
            email: 'paula@teste.com',
            role: 'DENTIST' as const,
            avatarUrl: null,
            organizationId: 'org-1',
          },
        },
      ],
      medicalRecords: [
        {
          id: 'record-procedure',
          organizationId: 'org-1',
          patientId: 'patient-1',
          dentistUserId: 'dentist-1',
          type: 'PROCEDURE' as const,
          title: 'Raspagem',
          description: 'Procedimento periodontal concluido.',
          attachments: ['https://files.test/odontograma-1.pdf'],
          createdAt: new Date('2025-02-05T09:00:00.000Z'),
          updatedAt: new Date('2025-02-05T09:00:00.000Z'),
          dentist: {
            id: 'dentist-1',
            name: 'Dra. Paula',
            email: 'paula@teste.com',
            role: 'DENTIST' as const,
            avatarUrl: null,
            organizationId: 'org-1',
          },
        },
        {
          id: 'record-note',
          organizationId: 'org-1',
          patientId: 'patient-1',
          dentistUserId: 'dentist-1',
          type: 'NOTE' as const,
          title: 'Observacao de retorno',
          description: 'Paciente sem dor e boa resposta ao tratamento.',
          attachments: null,
          createdAt: new Date('2025-02-06T09:00:00.000Z'),
          updatedAt: new Date('2025-02-06T09:00:00.000Z'),
          dentist: {
            id: 'dentist-1',
            name: 'Dra. Paula',
            email: 'paula@teste.com',
            role: 'DENTIST' as const,
            avatarUrl: null,
            organizationId: 'org-1',
          },
        },
      ],
      prescriptions: [
        {
          id: 'prescription-1',
          organizationId: 'org-1',
          patientId: 'patient-1',
          dentistUserId: 'dentist-1',
          content: 'Clorexidina 0,12% por 7 dias.',
          createdAt: new Date('2025-02-05T11:00:00.000Z'),
          updatedAt: new Date('2025-02-05T11:00:00.000Z'),
          dentist: {
            id: 'dentist-1',
            name: 'Dra. Paula',
            email: 'paula@teste.com',
            role: 'DENTIST' as const,
            avatarUrl: null,
            organizationId: 'org-1',
          },
        },
      ],
      financialRecords: [
        {
          id: 'fin-income-paid',
          organizationId: 'org-1',
          patientId: 'patient-1',
          description: 'Tratamento periodontal',
          amount: { toNumber: () => 300 },
          type: 'INCOME' as const,
          category: 'Procedimento',
          paymentStatus: 'PAID' as const,
          paymentMethod: 'PIX' as const,
          dueDate: new Date('2025-02-05T00:00:00.000Z'),
          paidAt: new Date('2025-02-05T12:00:00.000Z'),
          notes: 'Recebido no caixa.',
          invoiceNumber: 'NF-10',
          fiscalDocumentRef: null,
          nfeStatus: 'ISSUED' as const,
          createdAt: new Date('2025-02-05T00:00:00.000Z'),
          updatedAt: new Date('2025-02-05T12:00:00.000Z'),
          payments: [
            {
              id: 'payment-1',
              organizationId: 'org-1',
              financialRecordId: 'fin-income-paid',
              amount: { toNumber: () => 300 },
              method: 'PIX' as const,
              status: 'SETTLED' as const,
              paidAt: new Date('2025-02-05T12:00:00.000Z'),
              receivedFrom: 'Joao da Silva',
              paidTo: null,
              notes: null,
              installmentNumber: null,
              totalInstallments: null,
              receiptNumber: 'RCPT-001',
              createdByUserId: 'user-1',
              createdAt: new Date('2025-02-05T12:00:00.000Z'),
              updatedAt: new Date('2025-02-05T12:00:00.000Z'),
            },
          ],
        },
        {
          id: 'fin-income-overdue',
          organizationId: 'org-1',
          patientId: 'patient-1',
          description: 'Manutencao periodontal',
          amount: { toNumber: () => 200 },
          type: 'INCOME' as const,
          category: 'Procedimento',
          paymentStatus: 'OVERDUE' as const,
          paymentMethod: 'BOLETO' as const,
          dueDate: new Date('2025-02-08T00:00:00.000Z'),
          paidAt: null,
          notes: null,
          invoiceNumber: null,
          fiscalDocumentRef: null,
          nfeStatus: 'PENDING' as const,
          createdAt: new Date('2025-02-08T00:00:00.000Z'),
          updatedAt: new Date('2025-02-08T00:00:00.000Z'),
          payments: [],
        },
        {
          id: 'fin-expense',
          organizationId: 'org-1',
          patientId: 'patient-1',
          description: 'Material clinico vinculado',
          amount: { toNumber: () => 50 },
          type: 'EXPENSE' as const,
          category: 'Insumos',
          paymentStatus: 'PAID' as const,
          paymentMethod: 'CASH' as const,
          dueDate: new Date('2025-02-04T00:00:00.000Z'),
          paidAt: new Date('2025-02-04T11:00:00.000Z'),
          notes: null,
          invoiceNumber: null,
          fiscalDocumentRef: null,
          nfeStatus: null,
          createdAt: new Date('2025-02-04T00:00:00.000Z'),
          updatedAt: new Date('2025-02-04T11:00:00.000Z'),
          payments: [
            {
              id: 'payment-2',
              organizationId: 'org-1',
              financialRecordId: 'fin-expense',
              amount: { toNumber: () => 50 },
              method: 'CASH' as const,
              status: 'SETTLED' as const,
              paidAt: new Date('2025-02-04T11:00:00.000Z'),
              receivedFrom: null,
              paidTo: 'Fornecedor',
              notes: null,
              installmentNumber: null,
              totalInstallments: null,
              receiptNumber: 'RCPT-002',
              createdByUserId: 'user-1',
              createdAt: new Date('2025-02-04T11:00:00.000Z'),
              updatedAt: new Date('2025-02-04T11:00:00.000Z'),
            },
          ],
        },
      ],
      treatmentPlans: [
        {
          id: 'plan-1',
          organizationId: 'org-1',
          patientId: 'patient-1',
          createdByUserId: 'dentist-1',
          title: 'Plano periodontal',
          status: 'IN_PROGRESS' as const,
          discount: { toNumber: () => 25 },
          totalAmount: { toNumber: () => 475 },
          notes: 'Executar em duas etapas.',
          installments: 2,
          createdAt: new Date('2025-02-01T00:00:00.000Z'),
          updatedAt: new Date('2025-02-06T00:00:00.000Z'),
          items: [
            {
              id: 'plan-item-1',
              treatmentPlanId: 'plan-1',
              procedureId: null,
              procedureName: 'Raspagem',
              category: 'PERIO',
              tooth: null,
              quantity: 1,
              unitPrice: { toNumber: () => 500 },
              totalPrice: { toNumber: () => 500 },
              notes: null,
              createdAt: new Date('2025-02-01T00:00:00.000Z'),
              updatedAt: new Date('2025-02-01T00:00:00.000Z'),
            },
          ],
        },
      ],
    };

    let findFirstCall = 0;
    const restoreFindFirst = patchMethod(
      prisma.paciente,
      'findFirst',
      (async () => {
        findFirstCall += 1;
        if (findFirstCall === 1) {
          return {
            id: 'patient-1',
            organizationId: 'org-1',
          };
        }

        return patient;
      }) as typeof prisma.paciente.findFirst,
    );

    let upsertCalls = 0;
    const restoreUpsert = patchMethod(
      prisma.prontuario,
      'upsert',
      (async () => {
        upsertCalls += 1;
        return patient.prontuario;
      }) as unknown as typeof prisma.prontuario.upsert,
    );

    try {
      const summary = await useCases.getPatientSummary(user, 'patient-1');

      assert.equal(upsertCalls, 1);
      assert.equal(summary.chart.id, 'chart-1');
      assert.equal(summary.appointments.total, 2);
      assert.equal(summary.appointments.pendingCount, 1);
      assert.equal(summary.procedures.totalPerformed, 2);
      assert.equal(summary.prescriptions.total, 1);
      assert.equal(summary.financial.totals.generatedRevenue, 500);
      assert.equal(summary.financial.totals.patientLinkedCosts, 50);
      assert.equal(summary.financial.totals.totalPaid, 300);
      assert.equal(summary.financial.totals.totalOverdue, 200);
      assert.equal(summary.financial.totals.trackedProfit, 450);
      assert.equal(
        summary.pendingItems.some((item) => item.kind === 'FINANCIAL'),
        true,
      );
      assert.equal(
        summary.pendingItems.some((item) => item.kind === 'APPOINTMENT'),
        true,
      );
      assert.equal(summary.documents.total >= 2, true);
    } finally {
      restoreFindFirst();
      restoreUpsert();
    }
  });

  await test('falls back to legacy patient data when modern finance is absent', async () => {
    const patient = {
      ...createBasePatient(),
      serasaStatus: 'YELLOW' as const,
      prontuario: {
        id: 'chart-legacy',
        organizationId: 'org-1',
        pacienteId: 'patient-1',
        createdAt: new Date('2025-01-01T00:00:00.000Z'),
        updatedAt: new Date('2025-01-10T00:00:00.000Z'),
        diagnosticos: [],
        tratamentos: [
          {
            id: 'legacy-treatment-2',
            prontuarioId: 'chart-legacy',
            descricao: 'Tratamento restaurador antigo.',
            data: new Date('2024-01-05T10:00:00.000Z'),
          },
        ],
      },
      consultas: [
        {
          id: 'legacy-appointment',
          organizationId: 'org-1',
          agendaId: 'agenda-1',
          pacienteId: 'patient-1',
          dentistaId: 'dentist-legacy',
          dataHora: new Date('2099-02-15T13:30:00.000Z'),
          observacoes: 'Retorno legado.',
          dentista: {
            id: 'dentist-legacy',
            organizationId: 'org-1',
            nome: 'Dr. Claudio',
            cro: 'CRO-SP-999',
          },
        },
      ],
      receitas: [
        {
          id: 'legacy-prescription',
          organizationId: 'org-1',
          dentistaId: 'dentist-legacy',
          pacienteId: 'patient-1',
          conteudo: 'Analgesico em caso de dor.',
          createdAt: new Date('2024-01-05T12:00:00.000Z'),
          dentista: {
            id: 'dentist-legacy',
            organizationId: 'org-1',
            nome: 'Dr. Claudio',
            cro: 'CRO-SP-999',
          },
        },
      ],
      pagamentos: [
        {
          id: 'legacy-payment-pending',
          organizationId: 'org-1',
          pacienteId: 'patient-1',
          valor: { toNumber: () => 400 },
          status: 'PENDENTE' as const,
          createdAt: new Date('2024-01-05T00:00:00.000Z'),
          updatedAt: new Date('2024-01-05T00:00:00.000Z'),
          boleto: {
            id: 'boleto-1',
            pagamentoId: 'legacy-payment-pending',
            codigoBarras: '123',
            vencimento: new Date('2024-01-20T00:00:00.000Z'),
          },
          notaFiscal: null,
        },
        {
          id: 'legacy-payment-paid',
          organizationId: 'org-1',
          pacienteId: 'patient-1',
          valor: { toNumber: () => 250 },
          status: 'PAGO' as const,
          createdAt: new Date('2024-01-01T00:00:00.000Z'),
          updatedAt: new Date('2024-01-02T12:00:00.000Z'),
          boleto: null,
          notaFiscal: {
            id: 'nota-1',
            pagamentoId: 'legacy-payment-paid',
            numero: 'NF-LEG-1',
            chaveAcesso: 'KEY-1',
            emitidaEm: new Date('2024-01-02T12:00:00.000Z'),
          },
        },
      ],
      appointments: [],
      medicalRecords: [],
      prescriptions: [],
      financialRecords: [],
      treatmentPlans: [],
    };

    let findFirstCall = 0;
    const restoreFindFirst = patchMethod(
      prisma.paciente,
      'findFirst',
      (async () => {
        findFirstCall += 1;
        if (findFirstCall === 1) {
          return {
            id: 'patient-1',
            organizationId: 'org-1',
          };
        }

        return patient;
      }) as typeof prisma.paciente.findFirst,
    );

    const restoreUpsert = patchMethod(
      prisma.prontuario,
      'upsert',
      (async () => patient.prontuario) as unknown as typeof prisma.prontuario.upsert,
    );

    try {
      const summary = await useCases.getPatientSummary(user, 'patient-1');

      assert.equal(summary.financial.totals.generatedRevenue, 650);
      assert.equal(summary.financial.totals.totalPaid, 250);
      assert.equal(summary.financial.totals.totalPending, 400);
      assert.equal(summary.appointments.total, 1);
      assert.equal(summary.appointments.upcoming[0]?.statusOrigin, 'INFERRED');
      assert.equal(summary.prescriptions.total, 1);
      assert.equal(summary.chart.treatments.length, 1);
      assert.equal(
        summary.financial.entries.every((entry) => entry.source === 'LEGACY'),
        true,
      );
    } finally {
      restoreFindFirst();
      restoreUpsert();
    }
  });

  console.log(`\nSummary: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exitCode = 1;
  }
};

void run();
