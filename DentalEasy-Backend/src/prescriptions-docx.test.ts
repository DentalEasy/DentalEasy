import assert from 'node:assert/strict';
import JSZip from 'jszip';
import {
  buildPrescriptionDocxBuffer,
  createStructuredPrescriptionData,
} from './Application/Prescriptions';

const readDocumentXml = async (buffer: Buffer): Promise<string> => {
  const zip = await JSZip.loadAsync(buffer);
  const documentFile = zip.file('word/document.xml');

  if (!documentFile) {
    throw new Error('word/document.xml nao encontrado no DOCX.');
  }

  return documentFile.async('string');
};

const run = async () => {
  let passed = 0;
  let failed = 0;

  const test = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
      passed += 1;
      console.log(`PASS ${name}`);
    } catch (error) {
      failed += 1;
      console.error(`FAIL ${name}`);
      console.error(error);
    }
  };

  await test('exports A5 document with structured prescription content', async () => {
    const buffer = await buildPrescriptionDocxBuffer({
      organization: {
        name: 'Clinica Sorriso',
        document: '12.345.678/0001-90',
        address: 'Rua das Flores, 120',
        city: 'Sao Paulo',
        state: 'SP',
        phone: '(11) 3333-4444',
        email: 'contato@clinicasorriso.com',
      },
      patient: {
        name: 'Marina Souza',
        birthDate: new Date('1992-04-10T00:00:00.000Z'),
        cpf: '123.456.789-00',
        phone: '(11) 98888-7777',
        address: 'Av. Paulista, 1000',
      },
      professional: {
        displayName: 'Dra. Ana Paula',
        councilLabel: 'CRO: 12345-SP',
        specialty: 'Odontologia restauradora',
        signatureLabel: 'Assinatura e carimbo',
      },
      prescription: createStructuredPrescriptionData({
        category: 'CONTROLLED',
        title: 'Receituario Odontologico',
        includePatientAddress: true,
        requiresTwoCopies: true,
        controlledCategory: 'B1',
        issuePlace: 'Sao Paulo',
        medications: [
          {
            name: 'Amoxicilina',
            dcb: 'amoxicilina',
            pharmaceuticalForm: 'Capsulas',
            concentration: '500 mg',
            dosage: 'Tomar 1 capsula a cada 8 horas por 7 dias.',
            administrationRoute: 'Oral',
            treatmentDuration: '7 dias',
            quantity: '21 capsulas',
            additionalInstructions: 'Iniciar logo apos o procedimento.',
          },
        ],
        additionalInstructions: 'Manter hidratacao adequada durante o tratamento.',
        observations: 'Retorno em 5 dias para reavaliacao.',
        supplementarySection: {
          rest: 'Repouso relativo por 24 horas.',
          diet: 'Evitar alimentos muito quentes.',
        },
      }),
      issuedAt: new Date('2026-03-21T10:00:00.000Z'),
    });

    assert.ok(buffer.length > 0);

    const xml = await readDocumentXml(buffer);
    assert.match(xml, /w:pgSz[^>]*w:w="8391"[^>]*w:h="11906"/);
    assert.match(xml, /Clinica Sorriso/);
    assert.match(xml, /Marina Souza/);
    assert.match(xml, /CRO: 12345-SP/);
    assert.match(xml, /Amoxicilina/);
    assert.match(xml, /DCB: amoxicilina/);
    assert.match(xml, /Receita sujeita a controle especial \(B1\)/);
    assert.match(xml, /Emitir e arquivar em duas vias/);
    assert.match(xml, /Repouso relativo por 24 horas/);
    assert.match(xml, /w:type="page"/);
  });

  console.log(`\nSummary: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exitCode = 1;
  }
};

void run();
