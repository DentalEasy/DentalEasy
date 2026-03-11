import { ensureRole, ensureSameOrganization } from '../../shared/access-control';
import { UserContext } from '../../shared/types';
import { IProntuarioRepository } from './IProntuarioRepository';
import { Diagnostico } from './Diagnostico';
import { Prontuario } from './Prontuario';
import { Tratamento } from './Tratamento';

export class ProntuarioService {
  constructor(private readonly prontuarioRepository: IProntuarioRepository) {}

  async adicionarTratamento(
    user: UserContext,
    prontuario: Prontuario,
    tratamento: Omit<Tratamento, 'id'>,
  ): Promise<Prontuario> {
    ensureRole(user, ['DENTIST']);
    ensureSameOrganization(user, prontuario.props.organizationId);

    const novoTratamento: Tratamento = {
      ...tratamento,
      id: crypto.randomUUID(),
    };

    const atualizado = new Prontuario({
      ...prontuario.props,
      tratamentos: [...prontuario.props.tratamentos, novoTratamento],
      updatedAt: new Date(),
    });

    return this.prontuarioRepository.save(atualizado);
  }

  async adicionarDiagnostico(
    user: UserContext,
    prontuario: Prontuario,
    diagnostico: Omit<Diagnostico, 'id'>,
  ): Promise<Prontuario> {
    ensureRole(user, ['DENTIST']);
    ensureSameOrganization(user, prontuario.props.organizationId);

    const novoDiagnostico: Diagnostico = {
      ...diagnostico,
      id: crypto.randomUUID(),
    };

    const atualizado = new Prontuario({
      ...prontuario.props,
      diagnosticos: [...prontuario.props.diagnosticos, novoDiagnostico],
      updatedAt: new Date(),
    });

    return this.prontuarioRepository.save(atualizado);
  }
}
