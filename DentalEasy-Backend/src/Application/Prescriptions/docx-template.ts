import { readFile } from 'node:fs/promises';
import path from 'node:path';
import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  PageBreak,
  PageOrientation,
  Paragraph,
  Packer,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from 'docx';
import { PrescriptionDocxRenderInput, PrescriptionMedicationData } from './types';

const A5_PAGE_WIDTH_TWIPS = 8391;
const A5_PAGE_HEIGHT_TWIPS = 11906;
const PAGE_MARGIN = {
  top: 540,
  right: 620,
  bottom: 620,
  left: 620,
};

const palette = {
  accent: '1F4E5F',
  accentSoft: 'EAF2F4',
  accentSoftAlt: 'F5F8F9',
  text: '202124',
  muted: '606770',
  line: 'D6DEE2',
  warning: '7A1F1F',
  warningSoft: 'F8EAEA',
  white: 'FFFFFF',
};

const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg'] as const;

const safeText = (value: string | undefined): string | undefined => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

const normalizeAddress = (
  address?: string,
  city?: string,
  state?: string,
): string | undefined => {
  return [safeText(address), [safeText(city), safeText(state)].filter(Boolean).join(' - ')]
    .filter((entry) => entry && entry.length > 0)
    .join(' | ') || undefined;
};

const formatDateLong = (date: Date): string =>
  new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(
    date,
  );

const calculateAge = (birthDate: Date, referenceDate: Date): number => {
  let age = referenceDate.getFullYear() - birthDate.getFullYear();
  const monthDiff = referenceDate.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0
    || (monthDiff === 0 && referenceDate.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
};

const buildFieldParagraph = (label: string, value: string): Paragraph =>
  new Paragraph({
    spacing: { after: 70 },
    children: [
      new TextRun({
        text: `${label}: `,
        bold: true,
        color: palette.text,
        size: 19,
      }),
      new TextRun({
        text: value,
        color: palette.text,
        size: 19,
      }),
    ],
  });

const buildMutedParagraph = (text: string, alignment = AlignmentType.LEFT): Paragraph =>
  new Paragraph({
    alignment,
    spacing: { after: 80 },
    children: [
      new TextRun({
        text,
        color: palette.muted,
        size: 18,
      }),
    ],
  });

const buildLabel = (text: string): Paragraph =>
  new Paragraph({
    spacing: { after: 70 },
    children: [
      new TextRun({
        text: text.toUpperCase(),
        color: palette.accent,
        bold: true,
        size: 18,
      }),
    ],
  });

const buildDividerParagraph = (): Paragraph =>
  new Paragraph({
    border: {
      bottom: {
        color: palette.line,
        style: BorderStyle.SINGLE,
        size: 4,
      },
    },
    spacing: { after: 120 },
  });

const buildSectionBox = (children: Array<Paragraph | Table>): Table =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.SINGLE, color: palette.line, size: 6 },
      bottom: { style: BorderStyle.SINGLE, color: palette.line, size: 6 },
      left: { style: BorderStyle.SINGLE, color: palette.line, size: 6 },
      right: { style: BorderStyle.SINGLE, color: palette.line, size: 6 },
      insideHorizontal: { style: BorderStyle.NONE, color: palette.white, size: 0 },
      insideVertical: { style: BorderStyle.NONE, color: palette.white, size: 0 },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: palette.accentSoftAlt },
            margins: { top: 120, bottom: 120, left: 180, right: 180 },
            children,
          }),
        ],
      }),
    ],
  });

const buildInfoBadge = (text: string, warning = false): Table =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.NONE, color: palette.white, size: 0 },
      bottom: { style: BorderStyle.NONE, color: palette.white, size: 0 },
      left: { style: BorderStyle.NONE, color: palette.white, size: 0 },
      right: { style: BorderStyle.NONE, color: palette.white, size: 0 },
      insideHorizontal: { style: BorderStyle.NONE, color: palette.white, size: 0 },
      insideVertical: { style: BorderStyle.NONE, color: palette.white, size: 0 },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: warning ? palette.warningSoft : palette.accentSoft },
            margins: { top: 110, bottom: 110, left: 180, right: 180 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text,
                    bold: true,
                    color: warning ? palette.warning : palette.accent,
                    size: 18,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });

const buildMedicationHeader = (
  medication: PrescriptionMedicationData,
  index: number,
): Paragraph => {
  const headline = [
    `${index + 1}. ${medication.name}`,
    medication.dcb ? `(DCB: ${medication.dcb})` : undefined,
  ]
    .filter((entry): entry is string => Boolean(entry))
    .join(' ');

  return new Paragraph({
    spacing: { before: index === 0 ? 0 : 100, after: 50 },
    children: [
      new TextRun({
        text: headline,
        bold: true,
        color: palette.text,
        size: 21,
      }),
    ],
  });
};

const buildMedicationLine = (label: string, value?: string): Paragraph | undefined => {
  const normalizedValue = safeText(value);
  if (!normalizedValue) {
    return undefined;
  }

  return buildFieldParagraph(label, normalizedValue);
};

const buildMedicationBlock = (
  medication: PrescriptionMedicationData,
  index: number,
): Paragraph[] => {
  const paragraphs = [buildMedicationHeader(medication, index)];
  const details = [
    buildMedicationLine('Forma farmaceutica', medication.pharmaceuticalForm),
    buildMedicationLine('Concentracao', medication.concentration),
    buildMedicationLine('Posologia', medication.dosage?.replace(/\n/g, ' ')),
    buildMedicationLine('Via de administracao', medication.administrationRoute),
    buildMedicationLine('Duracao do tratamento', medication.treatmentDuration),
    buildMedicationLine('Quantidade', medication.quantity),
    buildMedicationLine(
      'Orientacoes adicionais',
      medication.additionalInstructions?.replace(/\n/g, ' '),
    ),
  ].filter((paragraph): paragraph is Paragraph => Boolean(paragraph));

  if (details.length === 0) {
    paragraphs.push(buildMutedParagraph('Sem detalhamento adicional informado.'));
  } else {
    paragraphs.push(...details);
  }

  return paragraphs;
};

const buildSignatureBox = (input: PrescriptionDocxRenderInput): Table => {
  const professionalLines = [
    input.professional.displayName,
    input.professional.councilLabel,
    input.professional.specialty,
  ].filter((entry): entry is string => Boolean(safeText(entry)));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.NONE, color: palette.white, size: 0 },
      bottom: { style: BorderStyle.NONE, color: palette.white, size: 0 },
      left: { style: BorderStyle.NONE, color: palette.white, size: 0 },
      right: { style: BorderStyle.NONE, color: palette.white, size: 0 },
      insideHorizontal: { style: BorderStyle.NONE, color: palette.white, size: 0 },
      insideVertical: { style: BorderStyle.NONE, color: palette.white, size: 0 },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            width: { size: 52, type: WidthType.PERCENTAGE },
            margins: { top: 60, bottom: 60, left: 40, right: 40 },
            children: [
              buildMutedParagraph(
                `${input.prescription.issuePlace ?? input.organization.city ?? 'Local nao informado'}, ${formatDateLong(
                  input.issuedAt,
                )}.`,
              ),
            ],
          }),
          new TableCell({
            verticalAlign: VerticalAlign.CENTER,
            width: { size: 48, type: WidthType.PERCENTAGE },
            margins: { top: 60, bottom: 60, left: 40, right: 40 },
            children: [
              new Paragraph({
                border: {
                  top: {
                    color: palette.text,
                    style: BorderStyle.SINGLE,
                    size: 8,
                  },
                },
                spacing: { before: 260, after: 80 },
              }),
              ...professionalLines.map(
                (line, index) =>
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: index === professionalLines.length - 1 ? 40 : 30 },
                    children: [
                      new TextRun({
                        text: line,
                        bold: index === 0,
                        color: palette.text,
                        size: index === 0 ? 20 : 18,
                      }),
                    ],
                  }),
              ),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    text: input.professional.signatureLabel ?? 'Assinatura e carimbo',
                    italics: true,
                    color: palette.muted,
                    size: 17,
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
};

const resolveImageBuffer = async (
  source: string,
): Promise<{ data: Buffer; type: 'jpg' | 'png' | 'gif' | 'bmp' } | undefined> => {
  const trimmed = source.trim();
  if (trimmed.length === 0) {
    return undefined;
  }

  if (trimmed.startsWith('data:')) {
    const match = /^data:([^;]+);base64,(.+)$/i.exec(trimmed);
    if (!match) {
      return undefined;
    }

    const mimeSubtype = match[1].split('/')[1]?.toLowerCase();
    const type =
      mimeSubtype === 'jpg' || mimeSubtype === 'png' || mimeSubtype === 'gif' || mimeSubtype === 'bmp'
        ? mimeSubtype
        : mimeSubtype === 'jpeg'
          ? 'jpg'
          : undefined;

    if (!type) {
      return undefined;
    }

    return {
      data: Buffer.from(match[2], 'base64'),
      type,
    };
  }

  if (/^https?:\/\//i.test(trimmed)) {
    const response = await fetch(trimmed).catch(() => undefined);
    if (!response?.ok) {
      return undefined;
    }

    const arrayBuffer = await response.arrayBuffer();
    const mimeSubtype = response.headers.get('content-type')?.split('/')[1]?.toLowerCase();
    const type =
      mimeSubtype === 'jpg' || mimeSubtype === 'png' || mimeSubtype === 'gif' || mimeSubtype === 'bmp'
        ? mimeSubtype
        : mimeSubtype === 'jpeg'
          ? 'jpg'
          : undefined;

    if (!type) {
      return undefined;
    }

    return {
      data: Buffer.from(arrayBuffer),
      type,
    };
  }

  const normalizedPath = trimmed.startsWith('/')
    ? path.join(process.cwd(), '..', trimmed)
    : trimmed;

  const extension = imageExtensions.find((item) =>
    normalizedPath.toLowerCase().endsWith(item),
  );

  const type =
    extension === '.jpg' || extension === '.jpeg'
      ? 'jpg'
      : extension === '.png'
        ? 'png'
        : extension === '.gif'
          ? 'gif'
          : extension === '.bmp'
            ? 'bmp'
            : undefined;

  if (!type) {
    return undefined;
  }

  return {
    data: await readFile(normalizedPath),
    type,
  };
};

const buildLogoParagraph = async (
  source?: string,
): Promise<Paragraph | undefined> => {
  const normalized = safeText(source);
  if (!normalized) {
    return undefined;
  }

  const image = await resolveImageBuffer(normalized).catch(() => undefined);
  if (!image) {
    return undefined;
  }

  return new Paragraph({
    alignment: AlignmentType.RIGHT,
    children: [
      new ImageRun({
        data: image.data,
        type: image.type,
        transformation: { width: 120, height: 120 },
      }),
    ],
  });
};

const buildHeader = async (input: PrescriptionDocxRenderInput): Promise<Table> => {
  const address = normalizeAddress(
    input.organization.address,
    input.organization.city,
    input.organization.state,
  );
  const professionalDescriptor = [
    input.professional.displayName,
    input.professional.specialty,
    input.professional.councilLabel,
  ]
    .filter((entry): entry is string => Boolean(safeText(entry)))
    .join(' | ');
  const contactLine = [
    safeText(input.organization.phone) ?? safeText(input.professional.phone),
    safeText(input.organization.email) ?? safeText(input.professional.email),
    safeText(input.organization.document),
  ]
    .filter((entry): entry is string => Boolean(entry))
    .join('  •  ');

  const rightSideChildren = [];
  const logoParagraph = await buildLogoParagraph(input.organization.logoUrl);
  if (logoParagraph) {
    rightSideChildren.push(logoParagraph);
  } else {
    rightSideChildren.push(
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: 'Receituario',
            bold: true,
            color: palette.accent,
            size: 24,
          }),
        ],
      }),
    );
  }

  rightSideChildren.push(
    new Paragraph({
      alignment: AlignmentType.RIGHT,
      spacing: { after: 0 },
      children: [
        new TextRun({
          text: 'Modelo odontologico A5',
          color: palette.muted,
          size: 17,
        }),
      ],
    }),
  );

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.NONE, color: palette.white, size: 0 },
      bottom: { style: BorderStyle.SINGLE, color: palette.accent, size: 10 },
      left: { style: BorderStyle.NONE, color: palette.white, size: 0 },
      right: { style: BorderStyle.NONE, color: palette.white, size: 0 },
      insideHorizontal: { style: BorderStyle.NONE, color: palette.white, size: 0 },
      insideVertical: { style: BorderStyle.NONE, color: palette.white, size: 0 },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 65, type: WidthType.PERCENTAGE },
            margins: { top: 40, bottom: 120, left: 40, right: 120 },
            children: [
              new Paragraph({
                spacing: { after: 90 },
                children: [
                  new TextRun({
                    text: input.organization.name,
                    bold: true,
                    color: palette.text,
                    size: 29,
                  }),
                ],
              }),
              professionalDescriptor
                ? buildMutedParagraph(professionalDescriptor)
                : buildMutedParagraph('Profissional responsavel'),
              ...(address ? [buildMutedParagraph(address)] : []),
              ...(contactLine ? [buildMutedParagraph(contactLine)] : []),
            ],
          }),
          new TableCell({
            width: { size: 35, type: WidthType.PERCENTAGE },
            margins: { top: 40, bottom: 120, left: 40, right: 40 },
            children: rightSideChildren,
          }),
        ],
      }),
    ],
  });
};

const buildPatientSection = (input: PrescriptionDocxRenderInput): Table => {
  const age = calculateAge(input.patient.birthDate, input.issuedAt);
  const identifierLines = [
    `CPF: ${input.patient.cpf}`,
    input.patient.phone ? `Telefone: ${input.patient.phone}` : undefined,
    input.patient.email ? `E-mail: ${input.patient.email}` : undefined,
  ].filter((entry): entry is string => Boolean(safeText(entry)));

  const patientRows: Paragraph[] = [
    buildLabel('Identificacao do paciente'),
    buildFieldParagraph('Nome completo', input.patient.name),
    buildFieldParagraph('Idade', `${age} anos`),
    ...identifierLines.map((entry) => buildMutedParagraph(entry)),
  ];

  if (input.prescription.includePatientAddress && input.patient.address) {
    patientRows.push(buildFieldParagraph('Endereco', input.patient.address));
  }

  return buildSectionBox(patientRows);
};

const buildPrescriptionBodySection = (input: PrescriptionDocxRenderInput): Table => {
  const headerParagraphs: Paragraph[] = [
    buildLabel(input.prescription.title),
    new Paragraph({
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: 'R/',
          bold: true,
          color: palette.accent,
          size: 34,
        }),
      ],
    }),
  ];

  const medicationParagraphs =
    input.prescription.medications.length > 0
      ? input.prescription.medications.flatMap((medication, index) =>
          buildMedicationBlock(medication, index),
        )
      : (input.prescription.content ?? '')
          .split('\n')
          .filter((line) => line.trim().length > 0)
          .map(
            (line) =>
              new Paragraph({
                spacing: { after: 70 },
                children: [
                  new TextRun({
                    text: line.trim(),
                    color: palette.text,
                    size: 20,
                  }),
                ],
              }),
          );

  if (medicationParagraphs.length === 0) {
    medicationParagraphs.push(
      buildMutedParagraph('Nenhuma informacao de prescricao foi informada.'),
    );
  }

  const footerParagraphs = [
    input.prescription.additionalInstructions
      ? buildFieldParagraph(
          'Orientacoes gerais',
          input.prescription.additionalInstructions.replace(/\n/g, ' '),
        )
      : undefined,
    input.prescription.observations
      ? buildFieldParagraph('Observacoes', input.prescription.observations.replace(/\n/g, ' '))
      : undefined,
  ].filter((paragraph): paragraph is Paragraph => Boolean(paragraph));

  return buildSectionBox([...headerParagraphs, ...medicationParagraphs, ...footerParagraphs]);
};

const buildSupplementarySection = (
  input: PrescriptionDocxRenderInput,
): Table | undefined => {
  const section = input.prescription.supplementarySection;
  if (!section) {
    return undefined;
  }

  const fieldsSource: Array<[string, string | undefined]> = [
    ['Orientacoes complementares', section.additionalGuidance],
    ['Observacoes clinicas', section.observations],
    ['Repouso', section.rest],
    ['Dieta', section.diet],
    ['Reacoes adversas', section.adverseReactions],
    ['Anotacoes extras', section.notes],
  ];

  const fields = fieldsSource.reduce<Paragraph[]>((paragraphs, [label, value]) => {
    const normalizedValue = safeText(value);
    if (!normalizedValue) {
      return paragraphs;
    }

    paragraphs.push(buildFieldParagraph(label, normalizedValue.replace(/\n/g, ' ')));
    return paragraphs;
  }, []);

  if (fields.length === 0) {
    return undefined;
  }

  return buildSectionBox([buildLabel('Secao complementar'), ...fields]);
};

const buildCopyChildren = async (
  input: PrescriptionDocxRenderInput,
): Promise<Array<Paragraph | Table>> => {
  const chips = [];

  if (input.prescription.category === 'CONTROLLED') {
    const controlledLabel = input.prescription.controlledCategory
      ? `Receita sujeita a controle especial (${input.prescription.controlledCategory})`
      : 'Receita sujeita a controle especial';
    chips.push(buildInfoBadge(controlledLabel, true));
  } else if (input.prescription.category === 'ANTIBIOTIC') {
    chips.push(buildInfoBadge('Fluxo preparado para antibioticos', false));
  }

  if (input.prescription.requiresTwoCopies) {
    chips.push(buildInfoBadge('Emitir e arquivar em duas vias', true));
  }

  const supplementarySection = buildSupplementarySection(input);

  return [
    await buildHeader(input),
    new Paragraph({ spacing: { after: 140 } }),
    ...chips,
    ...(chips.length > 0 ? [new Paragraph({ spacing: { after: 100 } })] : []),
    buildPatientSection(input),
    new Paragraph({ spacing: { after: 120 } }),
    buildPrescriptionBodySection(input),
    ...(supplementarySection
      ? [new Paragraph({ spacing: { after: 120 } }), supplementarySection]
      : []),
    new Paragraph({ spacing: { after: 110 } }),
    buildDividerParagraph(),
    buildSignatureBox(input),
  ];
};

export const buildPrescriptionDocxBuffer = async (
  input: PrescriptionDocxRenderInput,
): Promise<Buffer> => {
  const firstCopyChildren = await buildCopyChildren(input);
  const children = [...firstCopyChildren];

  if (input.prescription.requiresTwoCopies) {
    children.push(
      new Paragraph({
        children: [new PageBreak()],
      }),
    );
    children.push(...(await buildCopyChildren(input)));
  }

  const document = new Document({
    creator: 'DentalEasy',
    title: input.prescription.title,
    description: 'Receituario profissional exportado pelo DentalEasy',
    styles: {
      default: {
        document: {
          run: {
            font: 'Arial',
            color: palette.text,
          },
          paragraph: {
            spacing: { after: 40, line: 276 },
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: {
              width: A5_PAGE_WIDTH_TWIPS,
              height: A5_PAGE_HEIGHT_TWIPS,
              orientation: PageOrientation.PORTRAIT,
            },
            margin: PAGE_MARGIN,
          },
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(document);
};
