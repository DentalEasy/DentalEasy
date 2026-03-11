import { Diagnostico } from './Diagnostico';
import { Tratamento } from './Tratamento';

export interface ProntuarioProps {
  id: string;
  organizationId: string;
  pacienteId: string;
  tratamentos: Tratamento[];
  diagnosticos: Diagnostico[];
  createdAt: Date;
  updatedAt: Date;
}

export class Prontuario {
  constructor(public readonly props: ProntuarioProps) {}
}
