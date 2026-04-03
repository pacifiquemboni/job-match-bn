// src/routes/applicationRoutes.ts
import { Router } from 'express';
import { ApplicationController } from '../controllers/applicationController';

import { validateRequest } from '../utils/validation';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();
const applicationController = new ApplicationController();

router.post(
  '/',
  authenticate,
  authorize('WORKER'),
  validateRequest('createApplication'),
  applicationController.applyForJob
);

router.get(
  '/my',
  authenticate,
  authorize('WORKER'),
  applicationController.getMyApplications
);

router.get(
  '/client',
  authenticate,
  authorize('CLIENT'),
  applicationController.getClientApplications
);

router.get(
  '/job/:jobId',
  authenticate,
  authorize('CLIENT'),
  applicationController.getJobApplications
);

router.patch(
  '/:id/status',
  authenticate,
  authorize('CLIENT'),
  validateRequest('updateApplicationStatus'),
  applicationController.updateApplicationStatus
);

export default router;