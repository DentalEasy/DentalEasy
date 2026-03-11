import { ensureRole, ensureSameOrganization } from '../../shared/access-control';
import { UserContext } from '../../shared/types';
import { ValidationError } from '../../shared/errors';
import { IPacienteRepository } from './IPacienteRepository';
import { Paciente } from './Paciente';

export class PacienteService {
  constructor(private readonly pacienteRepository: IPacienteRepository) {}

  async criar(
    user: UserContext,
    input: Omit<Paciente['props'], 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Paciente> {
    ensureRole(user, ['ADMIN', 'SECRETARY']);
    ensureSameOrganization(user, input.organizationId);

    const existing = await this.pacienteRepository.findByCpf(
      input.cpf,
      input.organizationId,
    );

    if (existing) {
      throw new ValidationError('Ja existe paciente com este CPF na clinica.');
    }

    const paciente = Paciente.create(input);
    return this.pacienteRepository.create(paciente);
  }

  async listar(user: UserContext): Promise<Paciente[]> {
    ensureRole(user, ['ADMIN', 'SECRETARY', 'DENTIST']);
    return this.pacienteRepository.listByOrganization(user.organizationId);
  }
}
