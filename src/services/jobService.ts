// src/services/jobService.ts
import prisma from '../config/database';
import { CreateJobBody, SearchJobsQuery } from '../types';
import { JobStatus } from '@prisma/client';
import logger from '../utils/logger';

export class JobService {
  async createJob(clientId: string, data: CreateJobBody) {
    const { tags, ...jobData } = data;

    return prisma.job.create({
      data: {
        ...jobData,
        clientId,
        tags: {
          create: tags.map(tag => ({ tag })),
        },
      },
      include: {
        tags: true,
      },
    });
  }

  async getAllJobs(query: SearchJobsQuery, forWorkers: boolean = false) {
    const page = Math.max(1, parseInt(query.page as string) || 1);
    const limit = Math.min(100, parseInt(query.limit as string) || 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    // For workers, only show OPEN jobs unless they specifically filter by status
    if (forWorkers && !query.status) {
      where.status = 'OPEN';
    } else if (query.status) {
      where.status = query.status;
    }

    if (query.tags && query.tags.length > 0) {
      where.tags = {
        some: {
          tag: {
            in: query.tags,
          },
        },
      };
    }

    // Budget filtering
    if (query.minBudget !== undefined || query.maxBudget !== undefined) {
      where.budget = {};
      if (query.minBudget !== undefined) {
        where.budget.gte = parseFloat(query.minBudget as string);
      }
      if (query.maxBudget !== undefined) {
        where.budget.lte = parseFloat(query.maxBudget as string);
      }
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          client: {
            select: {
              id: true,
              email: true,
            },
          },
          tags: true,
          _count: {
            select: {
              applications: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    return {
      data: jobs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getJobById(id: string) {
    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            id: true,
            email: true,
          },
        },
        tags: true,
        applications: {
          select: {
            id: true,
            status: true,
            worker: {
              select: {
                id: true,
                email: true,
                workerProfile: true,
              },
            },
          },
        },
      },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    return job;
  }

  async getMyJobs(clientId: string) {
    return prisma.job.findMany({
      where: { clientId },
      include: {
        tags: true,
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateJobStatus(jobId: string, clientId: string, status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED') {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.clientId !== clientId) {
      throw new Error('You can only update your own jobs');
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      'OPEN': ['IN_PROGRESS', 'COMPLETED'],
      'IN_PROGRESS': ['COMPLETED', 'OPEN'],
      'COMPLETED': ['OPEN', 'IN_PROGRESS'],
    };

    if (!validTransitions[job.status].includes(status)) {
      throw new Error(`Cannot transition from ${job.status} to ${status}`);
    }

    return prisma.job.update({
      where: { id: jobId },
      data: { status },
      include: {
        client: {
          select: {
            id: true,
            email: true,
          },
        },
        tags: true,
        _count: {
          select: {
            applications: true,
          },
        },
      },
    });
  }
}