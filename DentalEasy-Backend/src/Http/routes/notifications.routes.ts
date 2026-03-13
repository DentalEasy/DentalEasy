import { Router } from 'express';
import { listNotificationsQuerySchema } from '../../Application/DTOs';
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
      const query = listNotificationsQuerySchema.parse(req.query);
      const data = await container.notificationsApiUseCases.listNotifications(
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
      const data = await container.notificationsApiUseCases.getNotificationById(
        user,
        id,
      );
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  '/:id/read',
  authorizeRoles(['ADMIN', 'SECRETARY', 'DENTIST']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const { id } = idParamSchema.parse(req.params);
      const data = await container.notificationsApiUseCases.markAsRead(user, id);
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  '/read-all',
  authorizeRoles(['ADMIN', 'SECRETARY', 'DENTIST']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const data = await container.notificationsApiUseCases.markAllAsRead(user);
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
      await container.notificationsApiUseCases.deleteNotification(user, id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
);

export { router as notificationsRoutes };
