export interface Consulta {
  id: string;
  organizationId: string;
  agendaId: string;
  pacienteId: string;
  dentistaId: string;
  dataHora: Date;
  observacoes?: string;
}
