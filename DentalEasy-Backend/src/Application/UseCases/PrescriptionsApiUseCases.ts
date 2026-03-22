import { Prisma } from '@prisma/client';
import { CreatePrescriptionDTO, ListPrescriptionsQueryDTO } from '../DTOs';
import {
  buildPrescriptionContentPreview,
  buildPrescriptionDocxBuffer,
  createStructuredPrescriptionData,
  resolvePrescriptionData,
  StructuredPrescriptionData,
} from '../Prescriptions';
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
  details: StructuredPrescriptionData;
  createdAt: string;
  updatedAt: string;
}

export interface PrescriptionDocxExport {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

type PrescriptionRecord = {
  id: string;
  organizationId: string;
  patientId: string;
  dentistUserId: string;
  content: string;
  metadata: Prisma.JsonValue | null;
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
};

const mapPrescription = (record: PrescriptionRecord): ApiPrescription => {
  const details = resolvePrescriptionData(record.metadata, record.content);

  return {
    id: record.id,
    organizationId: record.organizationId,
    patientId: record.patientId,
    dentistId: record.dentistUserId,
    patient: mapPatient(record.patient),
    dentist: mapUser(record.dentist),
    content: buildPrescriptionContentPreview(details),
    details,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
};

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

    const details = createStructuredPrescriptionData({
      scope: dto.scope,
      category: dto.category,
      title: dto.title,
      content: dto.content,
      medications: dto.medications,
      additionalInstructions: dto.additionalInstructions,
      observations: dto.observations,
      supplementarySection: dto.supplementarySection,
      requiresTwoCopies: dto.requiresTwoCopies,
      includePatientAddress: dto.includePatientAddress,
      controlledCategory: dto.controlledCategory,
      issuePlace: dto.issuePlace,
      professionalOverride: dto.professionalOverride,
    });

    const created = await prisma.prescription.create({
      data: {
        organizationId: user.organizationId,
        patientId: dto.patientId,
        dentistUserId: user.userId,
        content: buildPrescriptionContentPreview(details),
        metadata: details as unknown as Prisma.InputJsonValue,
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

    const details = resolvePrescriptionData(prescription.metadata, prescription.content);
    const legacyDentist = await prisma.dentista.findFirst({
      where: {
        organizationId: prescription.organizationId,
        nome: prescription.dentist.name,
      },
      select: {
        cro: true,
      },
    });

    const buffer = await buildPrescriptionDocxBuffer({
      organization: {
        name: prescription.organization.nome,
        logoUrl: prescription.organization.logoUrl ?? undefined,
        document: prescription.organization.cnpj ?? undefined,
        address: prescription.organization.address ?? undefined,
        city: prescription.organization.city ?? undefined,
        state: prescription.organization.state ?? undefined,
        phone: prescription.organization.phone ?? undefined,
        email: prescription.organization.email ?? undefined,
      },
      patient: {
        name: prescription.patient.nome,
        birthDate: prescription.patient.dataNascimento,
        cpf: prescription.patient.cpf,
        phone: prescription.patient.telefone,
        email: prescription.patient.email ?? undefined,
        address: prescription.patient.endereco ?? undefined,
      },
      professional: {
        displayName:
          details.professionalOverride?.displayName ?? prescription.dentist.name,
        councilLabel:
          details.professionalOverride?.councilLabel
          ?? (legacyDentist?.cro ? `CRO: ${legacyDentist.cro}` : undefined),
        specialty: details.professionalOverride?.specialty,
        email:
          details.professionalOverride?.email
          ?? prescription.organization.email
          ?? prescription.dentist.email,
        phone:
          details.professionalOverride?.phone ?? prescription.organization.phone ?? undefined,
        signatureLabel:
          details.professionalOverride?.signatureLabel ?? 'Assinatura e carimbo',
      },
      prescription: details,
      issuedAt: prescription.createdAt,
    });

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
