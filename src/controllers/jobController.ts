// src/controllers/jobController.ts
import { Response, NextFunction } from 'express';
import { JobService } from '../services/jobService';
import { AuthenticatedRequest, CreateJobBody, SearchJobsQuery, UpdateJobStatusBody } from '../types';
import logger from '../utils/logger';

const jobService = new JobService();

export class JobController {
  async createJob(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = req.body as CreateJobBody;
      const job = await jobService.createJob(req.user!.id, data);
      res.status(201).json({
        status: 'success',
        data: job,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllJobs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const query = req.query as SearchJobsQuery;
      const forWorkers = req.user?.role === 'WORKER';
      const result = await jobService.getAllJobs(query, forWorkers);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getJobById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const job = await jobService.getJobById(id);
      res.status(200).json({
        status: 'success',
        data: job,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Job not found') {
        res.status(404).json({
          status: 'error',
          message: error.message,
        });
      } else {
        next(error);
      }
    }
  }

  async updateJobStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body as UpdateJobStatusBody;
      const job = await jobService.updateJobStatus(id, req.user!.id, status);
      res.status(200).json({
        status: 'success',
        data: job,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Job not found') {
          res.status(404).json({
            status: 'error',
            message: error.message,
          });
        } else if (error.message.includes('Cannot transition')) {
          res.status(400).json({
            status: 'error',
            message: error.message,
          });
        } else {
          next(error);
        }
      } else {
        next(error);
      }
    }
  }

  async getMyJobs(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const jobs = await jobService.getMyJobs(req.user!.id);
      res.status(200).json({
        status: 'success',
        data: jobs,
      });
    } catch (error) {
      next(error);
    }
  }
}