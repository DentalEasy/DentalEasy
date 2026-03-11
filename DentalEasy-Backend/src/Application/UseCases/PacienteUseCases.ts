import { CreatePacienteDTO } from '../DTOs';
import { PacienteService } from '../../Domains/Paciente';
import { UserContext } from '../../shared/types';

export class PacienteUseCases {
  constructor(private readonly pacienteService: PacienteService) {}

  criarPaciente(user: UserContext, dto: CreatePacienteDTO) {
    return this.pacienteService.criar(user, dto);
  }

  listarPacientes(user: UserContext) {
    return this.pacienteService.listar(user);
  }
}
