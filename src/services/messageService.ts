// src/services/messageService.ts
import prisma from '../config/database';
import { ApplicationStatus } from '@prisma/client';
import logger from '../utils/logger';

export class MessageService {
  async sendMessage(senderId: string, applicationId: string, content: string) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        worker: true,
      },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    // Check if user is part of the application
    const isWorker = application.workerId === senderId;
    const isClient = application.job.clientId === senderId;

    if (!isWorker && !isClient) {
      throw new Error('You are not authorized to send messages in this conversation');
    }

    // Check if messaging is allowed (MATCHED or IN_PROGRESS status)
    const allowedStatuses: ApplicationStatus[] = ['MATCHED', 'IN_PROGRESS'];
    if (!allowedStatuses.includes(application.status)) {
      throw new Error('Messaging is only allowed for matched or in-progress applications');
    }

    return prisma.message.create({
      data: {
        applicationId,
        senderId,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async getMessages(applicationId: string, userId: string) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
        worker: true,
      },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    // Check if user is part of the conversation
    const isWorker = application.workerId === userId;
    const isClient = application.job.clientId === userId;

    if (!isWorker && !isClient) {
      throw new Error('You are not authorized to view these messages');
    }

    return prisma.message.findMany({
      where: { applicationId },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  async getUserConversations(userId: string) {
    // Get all applications where user is either worker or client
    const applications = await prisma.application.findMany({
      where: {
        OR: [
          { workerId: userId },
          { job: { clientId: userId } }
        ],
        status: { in: ['MATCHED', 'IN_PROGRESS', 'COMPLETED'] } // Only show conversations for active applications
      },
      include: {
        job: {
          include: {
            client: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
        },
        worker: {
          select: {
            id: true,
            email: true,
            role: true,
            workerProfile: {
              select: {
                skills: true,
                bio: true,
              },
            },
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, // Get only the last message for conversation preview
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    // Get unread counts per application for this user
    const unreadCounts = await prisma.message.groupBy({
      by: ['applicationId'],
      where: {
        applicationId: { in: applications.map(a => a.id) },
        senderId: { not: userId },
        read: false,
      },
      _count: { id: true },
    });

    const unreadMap = new Map(unreadCounts.map(r => [r.applicationId, r._count.id]));

    return applications.map(app => ({
      application: app,
      lastMessage: app.messages[0] || null,
      messageCount: app._count.messages,
      unreadCount: unreadMap.get(app.id) ?? 0,
      isUnread: (unreadMap.get(app.id) ?? 0) > 0,
      otherParty: app.workerId === userId ? app.job.client : app.worker,
    }));
  }

  async markMessagesAsRead(applicationId: string, userId: string) {
    await prisma.message.updateMany({
      where: {
        applicationId,
        senderId: { not: userId },
        read: false,
      },
      data: { read: true },
    });
  }
}