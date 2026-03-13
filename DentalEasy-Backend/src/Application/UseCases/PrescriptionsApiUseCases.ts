import { AlignmentType, Document, Packer, Paragraph, TextRun } from 'docx';
import { CreatePrescriptionDTO, ListPrescriptionsQueryDTO } from '../DTOs';
import { prisma } from '../../Infrastructure/Persistence';
import { ensureRole } from '../../shared/access-control';
import { NotFoundError, ValidationError } from '../../shared/errors';
import { UserContext } from '../../shared/types';
import { ApiPatient, ApiUser, mapPatient, mapUser, toISODate } from './shared-contracts';

export interface ApiPrescription {
  id: string;
  organizationId: string;
  patientId: string;
  dentistId: string;
  patient: ApiPatient;
  dentist: ApiUser;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionDocxExport {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

const mapPrescription = (record: {
  id: string;
  organizationId: string;
  patientId: string;
  dentistUserId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  patient: {
    id: string;
    organizationId: string;
    nome: string;
    email: string | null;
    telefone: string;
    cpf: string;
    dataNascimento: Date;
    avatarUrl: string | null;
    serasaStatus: 'GREEN' | 'YELLOW' | 'RED';
    endereco: string | null;
    alergias: string | null;
    observacoesMedicas: string | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
  dentist: {
    id: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'SECRETARY' | 'DENTIST';
    avatarUrl: string | null;
    organizationId: string;
  };
}): ApiPrescription => ({
  id: record.id,
  organizationId: record.organizationId,
  patientId: record.patientId,
  dentistId: record.dentistUserId,
  patient: mapPatient(record.patient),
  dentist: mapUser(record.dentist),
  content: record.content,
  createdAt: record.createdAt.toISOString(),
  updatedAt: record.updatedAt.toISOString(),
});

const slugify = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export class PrescriptionsApiUseCases {
  async listPrescriptions(
    user: UserContext,
    query: ListPrescriptionsQueryDTO,
  ): Promise<ApiPrescription[]> {
    ensureRole(user, ['ADMIN', 'DENTIST']);

    const records = await prisma.prescription.findMany({
      where: {
        organizationId: user.organizationId,
        patientId: query.patientId,
      },
      include: {
        patient: true,
        dentist: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map((record) => mapPrescription(record));
  }

  async createPrescription(
    user: UserContext,
    dto: CreatePrescriptionDTO,
  ): Promise<ApiPrescription> {
    ensureRole(user, ['ADMIN', 'DENTIST']);

    const patient = await prisma.paciente.findFirst({
      where: {
        id: dto.patientId,
        organizationId: user.organizationId,
        active: true,
      },
    });

    if (!patient) {
      throw new ValidationError('Paciente invalido para esta organizacao.');
    }

    const created = await prisma.prescription.create({
      data: {
        organizationId: user.organizationId,
        patientId: dto.patientId,
        dentistUserId: user.userId,
        content: dto.content,
      },
      include: {
        patient: true,
        dentist: true,
      },
    });

    return mapPrescription(created);
  }

  async exportPrescriptionDocx(
    user: UserContext,
    prescriptionId: string,
  ): Promise<PrescriptionDocxExport> {
    ensureRole(user, ['ADMIN', 'DENTIST']);

    const prescription = await prisma.prescription.findFirst({
      where: {
        id: prescriptionId,
        organizationId: user.organizationId,
      },
      include: {
        organization: true,
        patient: true,
        dentist: true,
      },
    });

    if (!prescription) {
      throw new NotFoundError('Receita nao encontrada.');
    }

    const document = new Document({
      sections: [
        {
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: prescription.organization.nome,
                  bold: true,
                  size: 32,
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `${prescription.organization.address ?? ''} ${
                    prescription.organization.city ?? ''
                  } ${prescription.organization.state ?? ''}`.trim(),
                  size: 20,
                }),
              ],
            }),
            new Paragraph({
              text: '',
            }),
            new Paragraph({
              children: [
                new TextRun({
                  text: `Paciente: ${prescription.patient.nome}`,
                  bold: true,
                }),
              ],
            }),
            new Paragraph({
              children: [new TextRun(`CPF: ${prescription.patient.cpf}`)],
            }),
            new Paragraph({
              children: [
                new TextRun(`Data de nascimento: ${toISODate(prescription.patient.dataNascimento)}`),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun(`Profissional: ${prescription.dentist.name}`),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun(`Data da receita: ${toISODate(prescription.createdAt)}`),
              ],
            }),
            new Paragraph({
              text: '',
            }),
            new Paragraph({
              children: [new TextRun({ text: 'Prescricao', bold: true, size: 26 })],
            }),
            ...prescription.content
              .split('\n')
              .filter((line) => line.trim().length > 0)
              .map(
                (line) =>
                  new Paragraph({
                    children: [new TextRun(line.trim())],
                  }),
              ),
            new Paragraph({ text: '' }),
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [new TextRun(`${prescription.dentist.name}`)],
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(document);
    const fileName = `receita-${slugify(prescription.patient.nome)}-${toISODate(
      prescription.createdAt,
    )}.docx`;

    return {
      fileName,
      mimeType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      buffer,
    };
  }
}
