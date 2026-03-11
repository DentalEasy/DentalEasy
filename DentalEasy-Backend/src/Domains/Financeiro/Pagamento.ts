import { Boleto } from './Boleto';
import { NotaFiscal } from './NotaFiscal';

export interface PagamentoProps {
  id: string;
  organizationId: string;
  pacienteId: string;
  valor: number;
  status: 'PENDENTE' | 'PAGO' | 'CANCELADO';
  boleto: Boleto;
  notaFiscal?: NotaFiscal;
  createdAt: Date;
  updatedAt: Date;
}

export class Pagamento {
  constructor(public readonly props: PagamentoProps) {}
}
