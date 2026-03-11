import { CreateConsultaDTO } from '../DTOs';
import { AgendamentoService } from '../../Domains/Agendamento';
import { UserContext } from '../../shared/types';

export class AgendamentoUseCases {
  constructor(private readonly agendamentoService: AgendamentoService) {}

  criarConsulta(user: UserContext, dto: CreateConsultaDTO) {
    return this.agendamentoService.criarConsulta(user, {
      id: dto.id ?? crypto.randomUUID(),
      ...dto,
    });
  }

  listarConsultas(user: UserContext) {
    return this.agendamentoService.listarConsultas(user);
  }
}
