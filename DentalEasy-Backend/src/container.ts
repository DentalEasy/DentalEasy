import {
  AgendamentoService,
  FinanceService,
  PacienteService,
  ProntuarioService,
  ReceituarioService,
} from './Domains';
import {
  AgendamentoUseCases,
  FinanceiroUseCases,
  PacienteUseCases,
  ProntuarioUseCases,
  ReceituarioUseCases,
} from './Application/UseCases';
import {
  PrismaAgendaRepository,
  PrismaPacienteRepository,
  PrismaPagamentoRepository,
  PrismaProntuarioRepository,
  PrismaReceitaRepository,
} from './Infrastructure/Persistence';
import { WhatsAppApi } from './Infrastructure/ExternalApis';
import { WhatsAppNotificacaoService } from './Infrastructure/Notifications';

const pacienteRepository = new PrismaPacienteRepository();
const prontuarioRepository = new PrismaProntuarioRepository();
const pagamentoRepository = new PrismaPagamentoRepository();
const agendaRepository = new PrismaAgendaRepository();
const receitaRepository = new PrismaReceitaRepository();

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
  pacienteUseCases: new PacienteUseCases(pacienteService),
  prontuarioUseCases: new ProntuarioUseCases(
    prontuarioService,
    prontuarioRepository,
  ),
  financeiroUseCases: new FinanceiroUseCases(financeService),
  agendamentoUseCases: new AgendamentoUseCases(agendamentoService),
  receituarioUseCases: new ReceituarioUseCases(receituarioService),
};
