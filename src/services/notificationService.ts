// src/services/notificationService.ts
import { prisma } from '../prisma/client';

export interface NotificationData {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
}

export const notificationService = {
  async create(notificationData: NotificationData) {
    return await prisma.notification.create({
      data: {
        userId: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data || null,
      },
    });
  },

  async getByUserId(userId: string, limit: number = 50) {
    return await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  async getUnreadCount(userId: string) {
    return await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });
  },

  async markAsRead(id: string, userId: string) {
    return await prisma.notification.update({
      where: { 
        id,
        userId, // Ensure user can only mark their own notifications as read
      },
      data: { read: true },
    });
  },

  async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: { 
        userId,
        read: false,
      },
      data: { read: true },
    });
  },

  async deleteOld(userId: string, olderThanDays: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    return await prisma.notification.deleteMany({
      where: {
        userId,
        createdAt: {
          lt: cutoffDate,
        },
        read: true, // Only delete read notifications
      },
    });
  },
};

export default notificationService;