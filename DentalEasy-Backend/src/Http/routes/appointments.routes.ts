import { Router } from 'express';
import {
  createAppointmentSchema,
  listAppointmentsQuerySchema,
  updateAppointmentSchema,
  updateAppointmentStatusSchema,
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
      const query = listAppointmentsQuerySchema.parse(req.query);
      const data = await container.appointmentsApiUseCases.listAppointments(
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
      const data = await container.appointmentsApiUseCases.getAppointmentById(
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
      const payload = createAppointmentSchema.parse(req.body);
      const data = await container.appointmentsApiUseCases.createAppointment(
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
      const payload = updateAppointmentSchema.parse(req.body);
      const data = await container.appointmentsApiUseCases.updateAppointment(
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
      const payload = updateAppointmentStatusSchema.parse(req.body);
      const data = await container.appointmentsApiUseCases.updateAppointmentStatus(
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
      await container.appointmentsApiUseCases.deleteAppointment(user, id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

export { router as appointmentsRoutes };
