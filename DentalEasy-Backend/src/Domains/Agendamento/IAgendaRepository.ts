import { Agenda } from './Agenda';
import { Consulta } from './Consulta';

export interface IAgendaRepository {
  findAgendaByDentistaId(
    dentistaId: string,
    organizationId: string,
  ): Promise<Agenda | null>;
  createConsulta(consulta: Consulta): Promise<Consulta>;
  listConsultasByOrganization(organizationId: string): Promise<Consulta[]>;
}
