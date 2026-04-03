// Message Routes
import { Router } from 'express';
import { MessageService } from './message.service';
import { authMiddleware } from '../../middleware/auth.middleware';

const router = Router();
const service = new MessageService();

router.post('/', authMiddleware, async (req, res) => {
  const msg = await service.send(req.user!.userId, req.body);
  res.json(msg);
});

router.get('/:applicationId', authMiddleware, async (req, res) => {
  const msgs = await service.get(req.user!.userId, req.params.applicationId);
  res.json(msgs);
});

export default router;