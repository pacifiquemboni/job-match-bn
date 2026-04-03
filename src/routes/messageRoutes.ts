// src/routes/messageRoutes.ts
import { Router } from 'express';
import { MessageController } from '../controllers/messageController';
import { authenticate } from '../middleware/auth';
import { validateRequest } from '../utils/validation';

const router = Router();
const messageController = new MessageController();

router.post(
  '/',
  authenticate,
  validateRequest('createMessage'),
  messageController.sendMessage.bind(messageController)
);

router.get(
  '/conversations/list',
  authenticate,
  messageController.getConversations.bind(messageController)
);

router.get(
  '/:applicationId',
  authenticate,
  messageController.getMessages.bind(messageController)
);

export default router;