// src/controllers/notificationController.ts
import { Request, Response } from 'express';
import notificationService from '../services/notificationService';
import logger from '../utils/logger';

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const notifications = await notificationService.getByUserId(userId, limit);
    
    res.json({ notifications });
  } catch (error) {
    logger.error('Error getting notifications:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const count = await notificationService.getUnreadCount(userId);
    res.json({ count });
  } catch (error) {
    logger.error('Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { notificationId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await notificationService.markAsRead(notificationId, userId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
};

export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await notificationService.markAllAsRead(userId);
    res.json({ success: true });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
};

export const cleanOldNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const days = parseInt(req.query.days as string) || 30;
    const result = await notificationService.deleteOld(userId, days);
    
    res.json({ success: true, deletedCount: result.count });
  } catch (error) {
    logger.error('Error cleaning old notifications:', error);
    res.status(500).json({ error: 'Failed to clean old notifications' });
  }
};