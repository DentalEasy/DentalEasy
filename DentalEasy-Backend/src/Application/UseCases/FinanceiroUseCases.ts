import { CreatePagamentoDTO } from '../DTOs';
import { FinanceService, Pagamento } from '../../Domains/Financeiro';
import { UserContext } from '../../shared/types';

export class FinanceiroUseCases {
  constructor(private readonly financeService: FinanceService) {}

  async criarPagamento(user: UserContext, dto: CreatePagamentoDTO) {
    const pagamento = new Pagamento({
      id: dto.id ?? crypto.randomUUID(),
      organizationId: dto.organizationId,
      pacienteId: dto.pacienteId,
      valor: dto.valor,
      status: dto.status,
      boleto: {
        id: dto.boleto.id ?? crypto.randomUUID(),
        codigoBarras: dto.boleto.codigoBarras,
        vencimento: dto.boleto.vencimento,
      },
      notaFiscal: dto.notaFiscal
        ? {
            id: dto.notaFiscal.id ?? crypto.randomUUID(),
            numero: dto.notaFiscal.numero,
            chaveAcesso: dto.notaFiscal.chaveAcesso,
            emitidaEm: dto.notaFiscal.emitidaEm,
          }
        : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return this.financeService.criarPagamento(user, pagamento);
  }

  listarPagamentos(user: UserContext) {
    return this.financeService.listarPagamentos(user);
  }
}
