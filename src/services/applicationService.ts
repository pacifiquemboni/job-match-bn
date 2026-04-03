// src/services/applicationService.ts
import prisma from '../config/database';
import { ApplicationStatus } from '@prisma/client';
import { sendApplicationCreatedNotification, sendApplicationStatusChangedNotification } from '../socket/notifications';
import logger from '../utils/logger';

export class ApplicationService {
  async applyForJob(workerId: string, jobId: string) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    // Only allow applications for OPEN jobs
    if (job.status !== 'OPEN') {
      throw new Error('This job is not currently accepting applications');
    }

    const existingApplication = await prisma.application.findUnique({
      where: {
        jobId_workerId: {
          jobId,
          workerId,
        },
      },
    });

    if (existingApplication) {
      throw new Error('You have already applied for this job');
    }

    const application = await prisma.application.create({
      data: {
        jobId,
        workerId,
        status: ApplicationStatus.PENDING,
      },
      include: {
        job: {
          include: {
            tags: true,
            client: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },
        worker: {
          include: {
            workerProfile: true,
          },
        },
      },
    });

    // Send notification to job owner (client)
    await sendApplicationCreatedNotification(application.job.client.id, application);

    return application;
  }

  async getMyApplications(workerId: string) {
    return prisma.application.findMany({
      where: { workerId },
      include: {
        job: {
          include: {
            client: {
              select: {
                id: true,
                email: true,
              },
            },
            tags: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getJobApplications(jobId: string, clientId: string) {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
    });

    if (!job) {
      throw new Error('Job not found');
    }

    if (job.clientId !== clientId) {
      throw new Error('You can only view applications for your own jobs');
    }

    return prisma.application.findMany({
      where: { jobId },
      include: {
        worker: {
          include: {
            workerProfile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateApplicationStatus(
    applicationId: string,
    clientId: string,
    newStatus: ApplicationStatus
  ) {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
      },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    if (application.job.clientId !== clientId) {
      throw new Error('You can only update applications for your own jobs');
    }

    const validTransitions: Record<ApplicationStatus, ApplicationStatus[]> = {
      PENDING: ['MATCHED', 'REJECTED'],
      MATCHED: ['IN_PROGRESS'],
      IN_PROGRESS: ['COMPLETED'],
      COMPLETED: [],
      REJECTED: [],
    };

    if (!validTransitions[application.status as ApplicationStatus].includes(newStatus)) {
      throw new Error(`Cannot transition from ${application.status} to ${newStatus}`);
    }

    const oldStatus = application.status;

    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: { status: newStatus },
      include: {
        job: true,
        worker: {
          include: {
            workerProfile: true,
          },
        },
      },
    });

    // Send notification to worker about status change
    await sendApplicationStatusChangedNotification(application.workerId, updatedApplication, oldStatus);

    // Job status is now managed separately by clients
    // Application status changes don't affect job status automatically

    return updatedApplication;
  }

  async getClientApplications(clientId: string) {
    return prisma.application.findMany({
      where: {
        job: {
          clientId: clientId,
        },
      },
      include: {
        job: {
          include: {
            client: {
              select: {
                id: true,
                email: true,
              },
            },
            tags: true,
          },
        },
        worker: {
          include: {
            workerProfile: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}