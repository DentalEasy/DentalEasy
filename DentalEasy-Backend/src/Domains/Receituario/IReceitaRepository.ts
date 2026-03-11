import { Receita } from './Receita';

export interface IReceitaRepository {
  create(receita: Receita): Promise<Receita>;
  findById(id: string, organizationId: string): Promise<Receita | null>;
  listByOrganization(organizationId: string): Promise<Receita[]>;
}
