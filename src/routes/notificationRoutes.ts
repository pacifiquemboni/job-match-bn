// src/routes/notificationRoutes.ts
import express from 'express';
import { 
  getNotifications, 
  getUnreadCount, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  cleanOldNotifications 
} from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.use(authenticate); // All notification routes require authentication

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.patch('/:notificationId/read', markNotificationAsRead);
router.patch('/mark-all-read', markAllNotificationsAsRead);
router.delete('/clean-old', cleanOldNotifications);

export default router;