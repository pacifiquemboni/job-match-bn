// Application Routes
import { Router } from 'express';
import { ApplicationService } from './application.service';
import { authMiddleware } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';

const router = Router();
const service = new ApplicationService();

router.post('/:jobId', authMiddleware, requireRole('WORKER'), async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Unauthenticated' });
  }
  const result = await service.apply(req.user.userId, req.params.jobId as string);
  res.json(result);
});

router.patch('/:id/status', authMiddleware, requireRole('CLIENT'), async (req, res) => {
  const result = await service.updateStatus(req.params.id as string, req.body.status);
  res.json(result);
});

export default router;