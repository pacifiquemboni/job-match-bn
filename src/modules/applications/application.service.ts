// Application Service
import { prisma } from '../../prisma/client';

const transitions: any = {
  PENDING: ['MATCHED'],
  MATCHED: ['IN_PROGRESS'],
  IN_PROGRESS: ['COMPLETED'],
};

export class ApplicationService {
  async apply(workerId: string, jobId: string) {
    return prisma.application.create({
      data: { workerId, jobId },
    });
  }

  async updateStatus(id: string, newStatus: string) {
    const app = await prisma.application.findUnique({ where: { id } });

    if (!transitions[app!.status].includes(newStatus)) {
      throw new Error('Invalid status transition');
    }

    return prisma.application.update({
      where: { id },
      data: { status: newStatus },
    });
  }
}