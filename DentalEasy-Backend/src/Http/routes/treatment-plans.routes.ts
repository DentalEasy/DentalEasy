import { Router } from 'express';
import {
  createTreatmentPlanSchema,
  listTreatmentPlansQuerySchema,
  updateTreatmentPlanSchema,
  updateTreatmentPlanStatusSchema,
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
      const query = listTreatmentPlansQuerySchema.parse(req.query);
      const data = await container.treatmentPlansApiUseCases.listTreatmentPlans(
        user,
        query,
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
      const data = await container.treatmentPlansApiUseCases.getTreatmentPlanById(
        user,
        id,
      );
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

router.post(
  '/',
  authorizeRoles(['ADMIN', 'SECRETARY', 'DENTIST']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const payload = createTreatmentPlanSchema.parse(req.body);
      const data = await container.treatmentPlansApiUseCases.createTreatmentPlan(
        user,
        payload,
      );
      res.status(201).json(data);
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  '/:id',
  authorizeRoles(['ADMIN', 'SECRETARY', 'DENTIST']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const { id } = idParamSchema.parse(req.params);
      const payload = updateTreatmentPlanSchema.parse(req.body);
      const data = await container.treatmentPlansApiUseCases.updateTreatmentPlan(
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

router.patch(
  '/:id/status',
  authorizeRoles(['ADMIN', 'SECRETARY', 'DENTIST']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const { id } = idParamSchema.parse(req.params);
      const payload = updateTreatmentPlanStatusSchema.parse(req.body);
      const data =
        await container.treatmentPlansApiUseCases.updateTreatmentPlanStatus(
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
  authorizeRoles(['ADMIN', 'SECRETARY', 'DENTIST']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const { id } = idParamSchema.parse(req.params);
      await container.treatmentPlansApiUseCases.deleteTreatmentPlan(user, id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

export { router as treatmentPlansRoutes };
