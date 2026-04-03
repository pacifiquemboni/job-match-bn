// src/socket/notifications.ts
import { Server } from 'socket.io';
import logger from '../utils/logger';
import notificationService from '../services/notificationService';

let ioInstance: Server | null = null;

export const setSocketInstance = (io: Server) => {
  ioInstance = io;
};

export const sendNotification = async (userId: string, notification: {
  id: string;
  type: 'application_created' | 'application_status_changed' | 'job_status_changed' | 'new_message';
  title: string;
  message: string;
  data?: any;
  createdAt: string;
}) => {
  try {
    // Save notification to database
    const savedNotification = await notificationService.create({
      userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
    });

    // Send real-time notification if user is online
    if (ioInstance) {
      ioInstance.to(`user:${userId}`).emit('notification', {
        ...notification,
        id: savedNotification.id,
        read: false,
      });
      logger.info(`Real-time notification sent to user ${userId}: ${notification.type}`);
    }

    logger.info(`Notification saved to database for user ${userId}: ${notification.type}`);
    return savedNotification;
  } catch (error) {
    logger.error(`Error sending notification to user ${userId}:`, error);
    throw error;
  }
};

export const sendApplicationCreatedNotification = async (clientId: string, application: any) => {
  return await sendNotification(clientId, {
    id: `app_created_${application.id}_${Date.now()}`,
    type: 'application_created',
    title: '🎯 New Application Received',
    message: `Someone applied for your job: ${application.job.title}`,
    data: {
      applicationId: application.id,
      jobId: application.job.id,
      jobTitle: application.job.title,
      workerEmail: application.worker?.email
    },
    createdAt: new Date().toISOString(),
  });
};

export const sendApplicationStatusChangedNotification = async (workerId: string, application: any, oldStatus: string) => {
  const statusMessages = {
    MATCHED: '✅ Your application was accepted!',
    REJECTED: '❌ Your application was declined',
    IN_PROGRESS: '🚀 Work has started on your application',
    COMPLETED: '🎉 Job completed! Great work!',
  };

  const message = statusMessages[application.status as keyof typeof statusMessages] || 'Your application status has changed';

  return await sendNotification(workerId, {
    id: `app_status_${application.id}_${Date.now()}`,
    type: 'application_status_changed',
    title: '📬 Application Update',
    message: `${message} for "${application.job.title}"`,
    data: {
      applicationId: application.id,
      jobId: application.job.id,
      jobTitle: application.job.title,
      oldStatus,
      newStatus: application.status,
    },
    createdAt: new Date().toISOString(),
  });
};

export const sendJobStatusChangedNotification = async (workerId: string, job: any, oldStatus: string) => {
  const statusMessages = {
    OPEN: '🟢 Job is now open for applications',
    IN_PROGRESS: '🔵 Job has started',
    COMPLETED: '⚫ Job has been completed',
  };

  const message = statusMessages[job.status as keyof typeof statusMessages] || 'Job status has changed';

  return await sendNotification(workerId, {
    id: `job_status_${job.id}_${Date.now()}`,
    type: 'job_status_changed',
    title: '📋 Job Update',
    message: `${message}: "${job.title}"`,
    data: {
      jobId: job.id,
      jobTitle: job.title,
      oldStatus,
      newStatus: job.status,
    },
    createdAt: new Date().toISOString(),
  });
};