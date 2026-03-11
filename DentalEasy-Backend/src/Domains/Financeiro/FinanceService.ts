import { ensureRole, ensureSameOrganization } from '../../shared/access-control';
import { UserContext } from '../../shared/types';
import { IPagamentoRepository } from './IPagamentoRepository';
import { Pagamento } from './Pagamento';

export class FinanceService {
  constructor(private readonly pagamentoRepository: IPagamentoRepository) {}

  async listarPagamentos(user: UserContext): Promise<Pagamento[]> {
    ensureRole(user, ['ADMIN', 'SECRETARY']);
    return this.pagamentoRepository.listByOrganization(user.organizationId);
  }

  async criarPagamento(user: UserContext, pagamento: Pagamento): Promise<Pagamento> {
    ensureRole(user, ['ADMIN', 'SECRETARY']);
    ensureSameOrganization(user, pagamento.props.organizationId);
    return this.pagamentoRepository.create(pagamento);
  }
}
