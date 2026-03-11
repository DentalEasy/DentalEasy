import { ensureRole, ensureSameOrganization } from '../../shared/access-control';
import { UserContext } from '../../shared/types';
import { IReceitaRepository } from './IReceitaRepository';
import { Receita } from './Receita';

export class ReceituarioService {
  constructor(private readonly receitaRepository: IReceitaRepository) {}

  async criarReceita(user: UserContext, receita: Receita): Promise<Receita> {
    ensureRole(user, ['DENTIST']);
    ensureSameOrganization(user, receita.organizationId);

    const novaReceita: Receita = {
      ...receita,
      id: receita.id || crypto.randomUUID(),
      createdAt: receita.createdAt ?? new Date(),
    };

    return this.receitaRepository.create(novaReceita);
  }

  async listarReceitas(user: UserContext): Promise<Receita[]> {
    ensureRole(user, ['DENTIST']);
    return this.receitaRepository.listByOrganization(user.organizationId);
  }
}
