import { Router } from 'express';
import {
  createMedicalRecordSchema,
  listMedicalRecordsQuerySchema,
  updateMedicalRecordSchema,
} from '../../Application/DTOs';
import { container } from '../../container';
import { authorizeRoles } from '../middlewares/auth.middleware';
import { getUserContext } from '../utils/user-context';
import { z } from 'zod';

const router = Router();
const idParamSchema = z.object({ id: z.string().uuid() });

router.get('/', authorizeRoles(['ADMIN', 'DENTIST']), async (req, res, next) => {
  try {
    const user = getUserContext(req);
    const query = listMedicalRecordsQuerySchema.parse(req.query);
    const data = await container.medicalRecordsApiUseCases.listMedicalRecords(
      user,
      query,
    );
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.post('/', authorizeRoles(['ADMIN', 'DENTIST']), async (req, res, next) => {
  try {
    const user = getUserContext(req);
    const payload = createMedicalRecordSchema.parse(req.body);
    const data = await container.medicalRecordsApiUseCases.createMedicalRecord(
      user,
      payload,
    );
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.patch(
  '/:id',
  authorizeRoles(['ADMIN', 'DENTIST']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const { id } = idParamSchema.parse(req.params);
      const payload = updateMedicalRecordSchema.parse(req.body);
      const data = await container.medicalRecordsApiUseCases.updateMedicalRecord(
        user,
        id,
        payload,
      );
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

router.delete(
  '/:id',
  authorizeRoles(['ADMIN', 'DENTIST']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const { id } = idParamSchema.parse(req.params);
      await container.medicalRecordsApiUseCases.deleteMedicalRecord(user, id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

export { router as medicalRecordsRoutes };
