import { AddDiagnosticoDTO, AddTratamentoDTO } from '../DTOs';
import { IProntuarioRepository, Prontuario, ProntuarioService } from '../../Domains/Prontuario';
import { UserContext } from '../../shared/types';

export class ProntuarioUseCases {
  constructor(
    private readonly prontuarioService: ProntuarioService,
    private readonly prontuarioRepository: IProntuarioRepository,
  ) {}

  async adicionarTratamento(user: UserContext, dto: AddTratamentoDTO) {
    const prontuario = await this.obterOuCriarProntuario(user.organizationId, dto.pacienteId);

    return this.prontuarioService.adicionarTratamento(user, prontuario, {
      descricao: dto.descricao,
      data: dto.data,
    });
  }

  async adicionarDiagnostico(user: UserContext, dto: AddDiagnosticoDTO) {
    const prontuario = await this.obterOuCriarProntuario(user.organizationId, dto.pacienteId);

    return this.prontuarioService.adicionarDiagnostico(user, prontuario, {
      descricao: dto.descricao,
      data: dto.data,
    });
  }

  private async obterOuCriarProntuario(
    organizationId: string,
    pacienteId: string,
  ): Promise<Prontuario> {
    const found = await this.prontuarioRepository.findByPacienteId(
      pacienteId,
      organizationId,
    );

    if (found) {
      return found;
    }

    const novo = new Prontuario({
      id: crypto.randomUUID(),
      organizationId,
      pacienteId,
      tratamentos: [],
      diagnosticos: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.prontuarioRepository.save(novo);
  }
}
