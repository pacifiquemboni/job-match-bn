// src/routes/jobRoutes.ts
import { Router } from 'express';
import { JobController } from '../controllers/jobController';
import { authenticate, authorize } from '../middleware/auth';
import { validateRequest } from '../utils/validation';

const router = Router();
const jobController = new JobController();

router.post(
  '/',
  authenticate,
  authorize('CLIENT'),
  validateRequest('createJob'),
  jobController.createJob
);

router.get('/', validateRequest('searchJobs'), jobController.getAllJobs);
router.get('/my', authenticate, authorize('CLIENT'), jobController.getMyJobs);
router.get('/:id', jobController.getJobById);

router.patch(
  '/:id/status',
  authenticate,
  authorize('CLIENT'),
  validateRequest('updateApplicationStatus'),
  jobController.updateJobStatus
);

export default router;