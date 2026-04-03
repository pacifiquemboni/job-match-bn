// Message Service
import { prisma } from '../../prisma/client';

export class MessageService {
  async send(userId: string, data: any) {
    const app = await prisma.application.findUnique({
      where: { id: data.applicationId },
    });

    if (!['MATCHED', 'IN_PROGRESS'].includes(app!.status)) {
      throw new Error('Chat not allowed');
    }

    return prisma.message.create({
      data: {
        ...data,
        senderId: userId,
      },
    });
  }

  async get(userId: string, applicationId: string | string[]) {
    return prisma.message.findMany({
      where: { applicationId, senderId: userId },
      orderBy: { createdAt: 'asc' },
    });
  }
}