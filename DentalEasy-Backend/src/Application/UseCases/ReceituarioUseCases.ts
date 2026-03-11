import { CreateReceitaDTO } from '../DTOs';
import { ReceituarioService } from '../../Domains/Receituario';
import { UserContext } from '../../shared/types';

export class ReceituarioUseCases {
  constructor(private readonly receituarioService: ReceituarioService) {}

  criarReceita(user: UserContext, dto: CreateReceitaDTO) {
    return this.receituarioService.criarReceita(user, {
      id: dto.id ?? crypto.randomUUID(),
      organizationId: dto.organizationId,
      dentistaId: dto.dentistaId,
      pacienteId: dto.pacienteId,
      conteudo: dto.conteudo,
      createdAt: new Date(),
    });
  }

  listarReceitas(user: UserContext) {
    return this.receituarioService.listarReceitas(user);
  }
}
