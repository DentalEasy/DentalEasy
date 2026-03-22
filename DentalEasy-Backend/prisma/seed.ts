import 'dotenv/config';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const parsedBcryptRounds = Number.parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10);
const bcryptRounds =
  Number.isFinite(parsedBcryptRounds) && parsedBcryptRounds >= 10
    ? parsedBcryptRounds
    : 12;

async function seed() {
  const organization = await prisma.organization.upsert({
    where: { slug: 'odonto-jales' },
    update: {
      nome: 'Clinica Odonto Jales',
      phone: '(17) 99999-9999',
      address: 'Rua Sao Paulo, 1234',
      city: 'Jales',
      state: 'SP',
      cnpj: '12.345.678/0001-90',
      plan: 'PRO',
    },
    create: {
      nome: 'Clinica Odonto Jales',
      slug: 'odonto-jales',
      phone: '(17) 99999-9999',
      address: 'Rua Sao Paulo, 1234',
      city: 'Jales',
      state: 'SP',
      cnpj: '12.345.678/0001-90',
      plan: 'PRO',
    },
  });

  const users = [
    {
      email: 'admin@teste.com',
      password: 'Admin#Dental2026',
      name: 'Dr. Lucas Mendes',
      role: 'ADMIN' as UserRole,
      cro: null,
    },
    {
      email: 'dentista@teste.com',
      password: 'Dentista#Dental2026',
      name: 'Dra. Camila Santos',
      role: 'DENTIST' as UserRole,
      cro: 'CRO-SP-12345',
    },
    {
      email: 'secretaria@teste.com',
      password: 'Secretaria#Dental2026',
      name: 'Ana Beatriz Lima',
      role: 'SECRETARY' as UserRole,
      cro: null,
    },
  ];

  const upsertedUsers = new Map<string, { id: string; name: string }>();

  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, bcryptRounds);

    const upsertedUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        role: user.role,
        organizationId: organization.id,
        passwordHash,
        active: true,
      },
      create: {
        name: user.name,
        email: user.email,
        role: user.role,
        organizationId: organization.id,
        passwordHash,
        active: true,
      },
    });

    upsertedUsers.set(user.email, {
      id: upsertedUser.id,
      name: upsertedUser.name,
    });

    if (user.role === 'DENTIST' && user.cro) {
      await prisma.dentista.upsert({
        where: {
          organizationId_cro: {
            organizationId: organization.id,
            cro: user.cro,
          },
        },
        update: {
          nome: user.name,
          organizationId: organization.id,
        },
        create: {
          id: upsertedUser.id,
          nome: user.name,
          cro: user.cro,
          organizationId: organization.id,
        },
      });
    }
  }

  const seededPatients = [
    {
      nome: 'Maria Silva',
      cpf: '12345678900',
      dataNascimento: new Date('1990-05-15T00:00:00.000Z'),
      email: 'maria@email.com',
      telefone: '17999765432',
      endereco: 'Rua A, 100 - Centro',
      serasaStatus: 'GREEN' as const,
      alergias: 'Penicilina',
      observacoesMedicas: 'Paciente com sensibilidade moderada.',
    },
    {
      nome: 'Joao Oliveira',
      cpf: '98765432100',
      dataNascimento: new Date('1985-11-20T00:00:00.000Z'),
      email: 'joao@email.com',
      telefone: '17999654321',
      endereco: 'Rua B, 250 - Jardim',
      serasaStatus: 'YELLOW' as const,
      alergias: null,
      observacoesMedicas: 'Historico de hipertensao.',
    },
    {
      nome: 'Ana Costa',
      cpf: '11122233344',
      dataNascimento: new Date('1978-03-08T00:00:00.000Z'),
      email: 'ana@email.com',
      telefone: '17999543210',
      endereco: 'Rua C, 80 - Vila Nova',
      serasaStatus: 'RED' as const,
      alergias: 'Dipirona',
      observacoesMedicas: 'Acompanhamento periodontal.',
    },
  ];

  const patientsByCpf = new Map<string, { id: string; nome: string }>();
  const chartsByCpf = new Map<string, { id: string; pacienteId: string }>();

  for (const patient of seededPatients) {
    const upsertedPatient = await prisma.paciente.upsert({
      where: {
        organizationId_cpf: {
          organizationId: organization.id,
          cpf: patient.cpf,
        },
      },
      update: {
        nome: patient.nome,
        dataNascimento: patient.dataNascimento,
        email: patient.email,
        telefone: patient.telefone,
        endereco: patient.endereco,
        serasaStatus: patient.serasaStatus,
        alergias: patient.alergias,
        observacoesMedicas: patient.observacoesMedicas,
        active: true,
      },
      create: {
        organizationId: organization.id,
        nome: patient.nome,
        cpf: patient.cpf,
        dataNascimento: patient.dataNascimento,
        email: patient.email,
        telefone: patient.telefone,
        endereco: patient.endereco,
        serasaStatus: patient.serasaStatus,
        alergias: patient.alergias,
        observacoesMedicas: patient.observacoesMedicas,
        active: true,
      },
    });

    patientsByCpf.set(patient.cpf, {
      id: upsertedPatient.id,
      nome: upsertedPatient.nome,
    });

    const chart = await prisma.prontuario.upsert({
      where: {
        pacienteId: upsertedPatient.id,
      },
      update: {},
      create: {
        organizationId: organization.id,
        pacienteId: upsertedPatient.id,
      },
    });

    chartsByCpf.set(patient.cpf, {
      id: chart.id,
      pacienteId: chart.pacienteId,
    });
  }

  await prisma.appointment.deleteMany({
    where: { organizationId: organization.id },
  });
  await prisma.appNotification.deleteMany({
    where: { organizationId: organization.id },
  });
  await prisma.inventoryMovement.deleteMany({
    where: { organizationId: organization.id },
  });
  await prisma.inventoryItem.deleteMany({
    where: { organizationId: organization.id },
  });
  await prisma.treatmentPlan.deleteMany({
    where: { organizationId: organization.id },
  });
  await prisma.procedure.deleteMany({
    where: { organizationId: organization.id },
  });
  await prisma.notificationPreference.deleteMany({
    where: { organizationId: organization.id },
  });
  await prisma.medicalRecord.deleteMany({
    where: { organizationId: organization.id },
  });
  await prisma.tratamento.deleteMany({
    where: {
      prontuarioId: {
        in: [...chartsByCpf.values()].map((chart) => chart.id),
      },
    },
  });
  await prisma.diagnostico.deleteMany({
    where: {
      prontuarioId: {
        in: [...chartsByCpf.values()].map((chart) => chart.id),
      },
    },
  });
  await prisma.prescription.deleteMany({
    where: { organizationId: organization.id },
  });
  await prisma.payment.deleteMany({
    where: { organizationId: organization.id },
  });
  await prisma.financialRecord.deleteMany({
    where: { organizationId: organization.id },
  });

  const procedures = await prisma.$transaction([
    prisma.procedure.create({
      data: {
        organizationId: organization.id,
        name: 'Limpeza',
        category: 'PREVENTIVO',
        description: 'Profilaxia e orientacao de higiene bucal.',
        price: 250,
        durationMinutes: 60,
      },
    }),
    prisma.procedure.create({
      data: {
        organizationId: organization.id,
        name: 'Restauracao Resina',
        category: 'RESTAURADOR',
        price: 350,
        durationMinutes: 60,
      },
    }),
    prisma.procedure.create({
      data: {
        organizationId: organization.id,
        name: 'Tratamento de Canal',
        category: 'ENDODONTIA',
        price: 1500,
        durationMinutes: 120,
      },
    }),
    prisma.procedure.create({
      data: {
        organizationId: organization.id,
        name: 'Clareamento',
        category: 'ESTETICA',
        price: 1200,
        durationMinutes: 90,
      },
    }),
    prisma.procedure.create({
      data: {
        organizationId: organization.id,
        name: 'Coroa Porcelana',
        category: 'PROTESE',
        price: 2500,
        durationMinutes: 90,
      },
    }),
  ]);

  const dentistUser = upsertedUsers.get('dentista@teste.com');
  const adminUser = upsertedUsers.get('admin@teste.com');
  if (!dentistUser) {
    throw new Error('Usuario dentista de seed nao encontrado.');
  }
  if (!adminUser) {
    throw new Error('Usuario admin de seed nao encontrado.');
  }

  const maria = patientsByCpf.get('12345678900');
  const joao = patientsByCpf.get('98765432100');
  const ana = patientsByCpf.get('11122233344');

  if (!maria || !joao || !ana) {
    throw new Error('Pacientes de seed nao encontrados.');
  }

  await prisma.appointment.createMany({
    data: [
      {
        organizationId: organization.id,
        patientId: maria.id,
        dentistUserId: dentistUser.id,
        date: new Date('2026-03-15T00:00:00.000Z'),
        startTime: '09:00',
        endTime: '10:00',
        status: 'CONFIRMED',
        procedure: 'Limpeza',
        notes: 'Primeira consulta do mes',
      },
      {
        organizationId: organization.id,
        patientId: joao.id,
        dentistUserId: dentistUser.id,
        date: new Date('2026-03-15T00:00:00.000Z'),
        startTime: '10:30',
        endTime: '11:30',
        status: 'PENDING',
        procedure: 'Restauracao',
      },
      {
        organizationId: organization.id,
        patientId: ana.id,
        dentistUserId: dentistUser.id,
        date: new Date('2026-03-16T00:00:00.000Z'),
        startTime: '14:00',
        endTime: '15:00',
        status: 'CANCELLED',
        procedure: 'Canal',
      },
    ],
  });

  await prisma.medicalRecord.createMany({
    data: [
      {
        organizationId: organization.id,
        patientId: maria.id,
        dentistUserId: dentistUser.id,
        type: 'PROCEDURE',
        title: 'Limpeza e profilaxia',
        description: 'Remocao de tartaro e orientacoes de higiene.',
      },
      {
        organizationId: organization.id,
        patientId: joao.id,
        dentistUserId: dentistUser.id,
        type: 'ANAMNESIS',
        title: 'Anamnese inicial',
        description: 'Paciente com sensibilidade em dente posterior.',
      },
      {
        organizationId: organization.id,
        patientId: maria.id,
        dentistUserId: dentistUser.id,
        type: 'NOTE',
        title: 'Retorno',
        description: 'Paciente retornou sem dor e boa evolucao.',
      },
    ],
  });

  await prisma.diagnostico.createMany({
    data: [
      {
        prontuarioId: chartsByCpf.get('12345678900')!.id,
        descricao: 'Gengivite leve em regiao anterior.',
        data: new Date('2026-03-08T09:00:00.000Z'),
      },
      {
        prontuarioId: chartsByCpf.get('98765432100')!.id,
        descricao: 'Lesao cariosa em dente 36 com indicacao restauradora.',
        data: new Date('2026-03-10T14:30:00.000Z'),
      },
    ],
  });

  await prisma.tratamento.createMany({
    data: [
      {
        prontuarioId: chartsByCpf.get('12345678900')!.id,
        descricao: 'Profilaxia e aplicacao topica de fluor.',
        data: new Date('2026-03-09T09:30:00.000Z'),
      },
      {
        prontuarioId: chartsByCpf.get('11122233344')!.id,
        descricao: 'Ajuste oclusal e orientacoes para controle periodontal.',
        data: new Date('2026-02-18T16:00:00.000Z'),
      },
    ],
  });

  await prisma.prescription.createMany({
    data: [
      {
        organizationId: organization.id,
        patientId: maria.id,
        dentistUserId: dentistUser.id,
        content:
          'Amoxicilina 500mg - Tomar 1 capsula de 8 em 8 horas por 7 dias.',
      },
      {
        organizationId: organization.id,
        patientId: joao.id,
        dentistUserId: dentistUser.id,
        content:
          'Ibuprofeno 600mg - Tomar 1 comprimido de 12 em 12 horas por 3 dias se dor.',
      },
    ],
  });

  const paidIncome = await prisma.financialRecord.create({
    data: {
      organizationId: organization.id,
      patientId: maria.id,
      description: 'Limpeza',
      amount: 250,
      type: 'INCOME',
      category: 'Procedimento',
      paymentStatus: 'PAID',
      paymentMethod: 'PIX',
      dueDate: new Date('2026-03-09T00:00:00.000Z'),
      paidAt: new Date('2026-03-09T10:00:00.000Z'),
      nfeStatus: 'ISSUED',
      notes: 'Pagamento recebido no caixa.',
    },
  });

  const pendingIncome = await prisma.financialRecord.create({
    data: {
      organizationId: organization.id,
      patientId: joao.id,
      description: 'Restauracao (3 dentes)',
      amount: 1200,
      type: 'INCOME',
      category: 'Procedimento',
      paymentStatus: 'PENDING',
      paymentMethod: 'CREDIT_CARD',
      dueDate: new Date('2026-03-15T00:00:00.000Z'),
      notes: 'Aguardando confirmacao do cliente.',
      nfeStatus: 'PENDING',
    },
  });

  const overdueIncome = await prisma.financialRecord.create({
    data: {
      organizationId: organization.id,
      patientId: ana.id,
      description: 'Canal + Coroa',
      amount: 2800,
      type: 'INCOME',
      category: 'Procedimento',
      paymentStatus: 'OVERDUE',
      dueDate: new Date('2026-02-20T00:00:00.000Z'),
      notes: 'Parcialmente recebido.',
      nfeStatus: 'PENDING',
    },
  });

  const paidExpense = await prisma.financialRecord.create({
    data: {
      organizationId: organization.id,
      description: 'Material descartavel',
      amount: 480,
      type: 'EXPENSE',
      category: 'Insumos',
      paymentStatus: 'PAID',
      paymentMethod: 'BOLETO',
      dueDate: new Date('2026-03-05T00:00:00.000Z'),
      paidAt: new Date('2026-03-04T12:00:00.000Z'),
      notes: 'Compra de estoque mensal.',
    },
  });

  await prisma.payment.createMany({
    data: [
      {
        organizationId: organization.id,
        financialRecordId: paidIncome.id,
        amount: 250,
        method: 'PIX',
        status: 'SETTLED',
        paidAt: new Date('2026-03-09T10:00:00.000Z'),
        receivedFrom: maria.nome,
        notes: 'Recebimento integral.',
        receiptNumber: 'RCPT-SEED-001',
        createdByUserId: adminUser.id,
      },
      {
        organizationId: organization.id,
        financialRecordId: overdueIncome.id,
        amount: 600,
        method: 'CASH',
        status: 'SETTLED',
        paidAt: new Date('2026-02-21T11:00:00.000Z'),
        receivedFrom: ana.nome,
        notes: 'Entrada parcial.',
        receiptNumber: 'RCPT-SEED-002',
        createdByUserId: adminUser.id,
      },
      {
        organizationId: organization.id,
        financialRecordId: paidExpense.id,
        amount: 480,
        method: 'BOLETO',
        status: 'SETTLED',
        paidAt: new Date('2026-03-04T12:00:00.000Z'),
        paidTo: 'Fornecedor Dental',
        notes: 'Pagamento de compra.',
        receiptNumber: 'RCPT-SEED-003',
        createdByUserId: adminUser.id,
      },
      {
        organizationId: organization.id,
        financialRecordId: pendingIncome.id,
        amount: 1200,
        method: 'CREDIT_CARD',
        status: 'PENDING',
        receivedFrom: joao.nome,
        notes: 'Aguardando captura da operadora.',
        installmentNumber: 1,
        totalInstallments: 3,
        receiptNumber: 'RCPT-SEED-004',
        createdByUserId: adminUser.id,
      },
    ],
  });

  await prisma.treatmentPlan.create({
    data: {
      organizationId: organization.id,
      patientId: maria.id,
      createdByUserId: dentistUser.id,
      title: 'Plano estetico inicial',
      status: 'APPROVED',
      discount: 100,
      totalAmount: 1700,
      installments: 3,
      notes: 'Paciente deseja iniciar pelo clareamento.',
      items: {
        create: [
          {
            procedureId: procedures[3].id,
            procedureName: procedures[3].name,
            category: procedures[3].category,
            quantity: 1,
            unitPrice: 1200,
            totalPrice: 1200,
          },
          {
            procedureId: procedures[0].id,
            procedureName: procedures[0].name,
            category: procedures[0].category,
            quantity: 1,
            unitPrice: 250,
            totalPrice: 250,
          },
          {
            procedureId: procedures[1].id,
            procedureName: procedures[1].name,
            category: procedures[1].category,
            quantity: 1,
            unitPrice: 350,
            totalPrice: 350,
          },
        ],
      },
    },
  });

  await prisma.treatmentPlan.create({
    data: {
      organizationId: organization.id,
      patientId: joao.id,
      createdByUserId: dentistUser.id,
      title: 'Reabilitacao dente posterior',
      status: 'SENT',
      totalAmount: 4000,
      installments: 5,
      items: {
        create: [
          {
            procedureId: procedures[2].id,
            procedureName: procedures[2].name,
            category: procedures[2].category,
            quantity: 1,
            unitPrice: 1500,
            totalPrice: 1500,
            tooth: '36',
          },
          {
            procedureId: procedures[4].id,
            procedureName: procedures[4].name,
            category: procedures[4].category,
            quantity: 1,
            unitPrice: 2500,
            totalPrice: 2500,
            tooth: '36',
          },
        ],
      },
    },
  });

  const gloves = await prisma.inventoryItem.create({
    data: {
      organizationId: organization.id,
      name: 'Luvas de Procedimento',
      sku: 'LUV-P-M',
      category: 'DESCARTAVEL',
      unit: 'un',
      currentStock: 120,
      minStock: 200,
      cost: 0.45,
      supplier: 'DentalMed',
      active: true,
    },
  });

  const resina = await prisma.inventoryItem.create({
    data: {
      organizationId: organization.id,
      name: 'Resina Composta A2',
      sku: 'RES-A2',
      category: 'MATERIAL',
      unit: 'seringa',
      currentStock: 12,
      minStock: 8,
      cost: 85,
      supplier: '3M ESPE',
      active: true,
    },
  });

  await prisma.inventoryMovement.createMany({
    data: [
      {
        organizationId: organization.id,
        inventoryItemId: gloves.id,
        type: 'RESTOCK',
        quantity: 120,
        cost: 0.45,
        notes: 'Reposicao inicial de seed',
        date: new Date('2026-03-10T10:00:00.000Z'),
      },
      {
        organizationId: organization.id,
        inventoryItemId: resina.id,
        type: 'RESTOCK',
        quantity: 12,
        cost: 85,
        date: new Date('2026-03-10T10:00:00.000Z'),
      },
    ],
  });

  await prisma.notificationPreference.create({
    data: {
      organizationId: organization.id,
      appointmentReminders: true,
      paymentAlerts: true,
      inventoryAlerts: true,
      systemAlerts: true,
    },
  });

  await prisma.appNotification.createMany({
    data: [
      {
        organizationId: organization.id,
        type: 'SYSTEM',
        title: 'Sistema inicializado',
        message: 'Dados iniciais da clinica foram carregados.',
        eventKey: 'seed-system-init',
      },
      {
        organizationId: organization.id,
        type: 'PAYMENT',
        title: 'Pagamento vencido',
        message: `A conta de ${ana.nome} esta vencida.`,
        eventKey: `seed-overdue-${ana.id}`,
      },
      {
        organizationId: organization.id,
        type: 'INVENTORY',
        title: 'Estoque baixo',
        message: `${gloves.name} esta abaixo do minimo.`,
        eventKey: `seed-inventory-${gloves.id}`,
      },
    ],
  });
}

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error('Erro ao executar seed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
