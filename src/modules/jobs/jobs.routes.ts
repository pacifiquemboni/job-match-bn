import { Router } from 'express';
import { JobService } from './jobs.service';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';

const router = Router();
const service = new JobService();

router.post('/', authMiddleware, requireRole('CLIENT'), async (req, res) => {
  const job = await service.create(req.user!.userId, req.body);
  res.json(job);
});

router.get('/', async (req, res) => {
  const jobs = await service.getAll(req.query.search as string);
  res.json(jobs);
});

export default router;