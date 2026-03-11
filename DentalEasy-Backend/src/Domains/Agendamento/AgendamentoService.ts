import { ensureRole, ensureSameOrganization } from '../../shared/access-control';
import { UserContext } from '../../shared/types';
import { IAgendaRepository } from './IAgendaRepository';
import { Consulta } from './Consulta';
import { NotificacaoService } from './NotificacaoService';

export class AgendamentoService {
  constructor(
    private readonly agendaRepository: IAgendaRepository,
    private readonly notificacaoService: NotificacaoService,
  ) {}

  async criarConsulta(user: UserContext, consulta: Consulta): Promise<Consulta> {
    ensureRole(user, ['ADMIN', 'SECRETARY']);
    ensureSameOrganization(user, consulta.organizationId);

    const novaConsulta: Consulta = {
      ...consulta,
      id: consulta.id || crypto.randomUUID(),
    };

    const persisted = await this.agendaRepository.createConsulta(novaConsulta);
    await this.notificacaoService.enviarLembreteConsulta(persisted);
    return persisted;
  }

  async listarConsultas(user: UserContext): Promise<Consulta[]> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);
    return this.agendaRepository.listConsultasByOrganization(user.organizationId);
  }
}
