import { prisma } from '../../prisma/client';

export class JobService {
  async create(clientId: string, data: any) {
    return prisma.job.create({
      data: {
        ...data,
        clientId,
        tags: {
          create: data.tags.map((tag: string) => ({ tag })),
        },
      },
    });
  }

  async getAll(search?: string) {
    return prisma.job.findMany({
      where: search
        ? {
            tags: {
              some: {
                tag: { contains: search, mode: 'insensitive' },
              },
            },
          }
        : {},
      include: { tags: true },
    });
  }
}