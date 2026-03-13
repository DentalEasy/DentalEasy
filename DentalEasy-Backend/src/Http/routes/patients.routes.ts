import { Router } from 'express';
import {
  createPatientSchema,
  listPatientsQuerySchema,
  updatePatientSchema,
} from '../../Application/DTOs';
import { container } from '../../container';
import { authorizeRoles } from '../middlewares/auth.middleware';
import { getUserContext } from '../utils/user-context';
import { z } from 'zod';

const router = Router();
const idParamSchema = z.object({ id: z.string().uuid() });

router.get(
  '/',
  authorizeRoles(['ADMIN', 'SECRETARY', 'DENTIST']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const query = listPatientsQuerySchema.parse(req.query);
      const data = await container.patientsApiUseCases.listPatients(user, query);
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  '/:id/medical-records',
  authorizeRoles(['ADMIN', 'DENTIST']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const { id } = idParamSchema.parse(req.params);
      const data =
        await container.medicalRecordsApiUseCases.listMedicalRecordsByPatient(
          user,
          id,
        );
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  '/:id',
  authorizeRoles(['ADMIN', 'SECRETARY', 'DENTIST']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const { id } = idParamSchema.parse(req.params);
      const data = await container.patientsApiUseCases.getPatientById(user, id);
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

router.post('/', authorizeRoles(['ADMIN', 'SECRETARY']), async (req, res, next) => {
  try {
    const user = getUserContext(req);
    const payload = createPatientSchema.parse(req.body);
    const data = await container.patientsApiUseCases.createPatient(user, payload);
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.patch(
  '/:id',
  authorizeRoles(['ADMIN', 'SECRETARY']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const { id } = idParamSchema.parse(req.params);
      const payload = updatePatientSchema.parse(req.body);
      const data = await container.patientsApiUseCases.updatePatient(
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
  authorizeRoles(['ADMIN', 'SECRETARY']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const { id } = idParamSchema.parse(req.params);
      await container.patientsApiUseCases.deletePatient(user, id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

export { router as patientsRoutes };
