import { Router } from 'express';
import {
  createTeamMemberSchema,
  updateNotificationPreferencesSchema,
  updateOrganizationSettingsSchema,
  updateTeamMemberSchema,
} from '../../Application/DTOs';
import { container } from '../../container';
import { authorizeRoles } from '../middlewares/auth.middleware';
import { getUserContext } from '../utils/user-context';
import { z } from 'zod';

const router = Router();
const idParamSchema = z.object({ id: z.string().uuid() });

router.get(
  '/organization',
  authorizeRoles(['ADMIN', 'SECRETARY', 'DENTIST']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const data = await container.settingsApiUseCases.getOrganizationSettings(
        user,
      );
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  '/organization',
  authorizeRoles(['ADMIN']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const payload = updateOrganizationSettingsSchema.parse(req.body);
      const data =
        await container.settingsApiUseCases.updateOrganizationSettings(
          user,
          payload,
        );
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  '/team',
  authorizeRoles(['ADMIN']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const data = await container.settingsApiUseCases.listTeam(user);
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

router.post('/team', authorizeRoles(['ADMIN']), async (req, res, next) => {
  try {
    const user = getUserContext(req);
    const payload = createTeamMemberSchema.parse(req.body);
    const data = await container.settingsApiUseCases.createTeamMember(
      user,
      payload,
    );
    res.status(201).json(data);
  } catch (error) {
    next(error);
  }
});

router.patch(
  '/team/:id',
  authorizeRoles(['ADMIN']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const { id } = idParamSchema.parse(req.params);
      const payload = updateTeamMemberSchema.parse(req.body);
      const data = await container.settingsApiUseCases.updateTeamMember(
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

router.get(
  '/notifications',
  authorizeRoles(['ADMIN', 'SECRETARY', 'DENTIST']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const data =
        await container.settingsApiUseCases.getNotificationPreferences(user);
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

router.patch(
  '/notifications',
  authorizeRoles(['ADMIN']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const payload = updateNotificationPreferencesSchema.parse(req.body);
      const data =
        await container.settingsApiUseCases.updateNotificationPreferences(
          user,
          payload,
        );
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

router.get(
  '/plan',
  authorizeRoles(['ADMIN', 'SECRETARY', 'DENTIST']),
  async (req, res, next) => {
    try {
      const user = getUserContext(req);
      const data = await container.settingsApiUseCases.getPlanInfo(user);
      res.json(data);
    } catch (error) {
      next(error);
    }
  },
);

export { router as settingsRoutes };
