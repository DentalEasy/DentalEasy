import { Consulta } from './Consulta';

export interface Agenda {
  id: string;
  organizationId: string;
  dentistaId: string;
  consultas: Consulta[];
}
