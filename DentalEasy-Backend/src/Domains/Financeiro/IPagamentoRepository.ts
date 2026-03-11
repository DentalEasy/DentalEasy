import { Pagamento } from './Pagamento';

export interface IPagamentoRepository {
  create(pagamento: Pagamento): Promise<Pagamento>;
  update(pagamento: Pagamento): Promise<Pagamento>;
  findById(id: string, organizationId: string): Promise<Pagamento | null>;
  listByOrganization(organizationId: string): Promise<Pagamento[]>;
}
