import {
  AgendamentoService,
  FinanceService,
  PacienteService,
  ProntuarioService,
  ReceituarioService,
} from './Domains';
import {
  AgendamentoUseCases,
  AppointmentsApiUseCases,
  AuthUseCases,
  FinancialRecordsApiUseCases,
  FinanceiroUseCases,
  MedicalRecordsApiUseCases,
  NotificationsApiUseCases,
  PacienteUseCases,
  PatientsApiUseCases,
  PrescriptionsApiUseCases,
  ProceduresApiUseCases,
  ProntuarioUseCases,
  ReportsApiUseCases,
  ReceituarioUseCases,
  SettingsApiUseCases,
  TreatmentPlansApiUseCases,
  PaymentsApiUseCases,
  UsersApiUseCases,
  InventoryApiUseCases,
  DashboardApiUseCases,
} from './Application/UseCases';
import {
  PrismaAgendaRepository,
  PrismaPacienteRepository,
  PrismaPagamentoRepository,
  PrismaProntuarioRepository,
  PrismaReceitaRepository,
  PrismaUserRepository,
} from './Infrastructure/Persistence';
import { WhatsAppApi } from './Infrastructure/ExternalApis';
import { WhatsAppNotificacaoService } from './Infrastructure/Notifications';

const pacienteRepository = new PrismaPacienteRepository();
const prontuarioRepository = new PrismaProntuarioRepository();
const pagamentoRepository = new PrismaPagamentoRepository();
const agendaRepository = new PrismaAgendaRepository();
const receitaRepository = new PrismaReceitaRepository();
const userRepository = new PrismaUserRepository();

const notificacaoService = new WhatsAppNotificacaoService(new WhatsAppApi());

const pacienteService = new PacienteService(pacienteRepository);
const prontuarioService = new ProntuarioService(prontuarioRepository);
const financeService = new FinanceService(pagamentoRepository);
const agendamentoService = new AgendamentoService(
  agendaRepository,
  notificacaoService,
);
const receituarioService = new ReceituarioService(receitaRepository);

export const container = {
  authUseCases: new AuthUseCases(userRepository),
  pacienteUseCases: new PacienteUseCases(pacienteService),
  patientsApiUseCases: new PatientsApiUseCases(),
  prontuarioUseCases: new ProntuarioUseCases(
    prontuarioService,
    prontuarioRepository,
  ),
  medicalRecordsApiUseCases: new MedicalRecordsApiUseCases(),
  financeiroUseCases: new FinanceiroUseCases(financeService),
  financialRecordsApiUseCases: new FinancialRecordsApiUseCases(),
  paymentsApiUseCases: new PaymentsApiUseCases(),
  agendamentoUseCases: new AgendamentoUseCases(agendamentoService),
  appointmentsApiUseCases: new AppointmentsApiUseCases(),
  receituarioUseCases: new ReceituarioUseCases(receituarioService),
  prescriptionsApiUseCases: new PrescriptionsApiUseCases(),
  usersApiUseCases: new UsersApiUseCases(),
  proceduresApiUseCases: new ProceduresApiUseCases(),
  treatmentPlansApiUseCases: new TreatmentPlansApiUseCases(),
  inventoryApiUseCases: new InventoryApiUseCases(),
  notificationsApiUseCases: new NotificationsApiUseCases(),
  settingsApiUseCases: new SettingsApiUseCases(),
  dashboardApiUseCases: new DashboardApiUseCases(),
  reportsApiUseCases: new ReportsApiUseCases(),
};
