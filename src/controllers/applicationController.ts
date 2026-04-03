// src/controllers/applicationController.ts
import { Response, NextFunction } from 'express';
import { ApplicationService } from '../services/applicationService';
import { AuthenticatedRequest, CreateApplicationBody, UpdateApplicationStatusBody } from '../types';
import logger from '../utils/logger';

const applicationService = new ApplicationService();

export class ApplicationController {
  async applyForJob(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { jobId } = req.body as CreateApplicationBody;
      const application = await applicationService.applyForJob(req.user!.id, jobId);
      res.status(201).json({
        status: 'success',
        data: application,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Job not found') {
          res.status(404).json({
            status: 'error',
            message: error.message,
          });
        } else if (error.message === 'Job is not open for applications' ||
                   error.message === 'You have already applied for this job') {
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

  async getMyApplications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const applications = await applicationService.getMyApplications(req.user!.id);
      res.status(200).json({
        status: 'success',
        data: applications,
      });
    } catch (error) {
      next(error);
    }
  }

  async getJobApplications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { jobId } = req.params;
      const applications = await applicationService.getJobApplications(jobId, req.user!.id);
      res.status(200).json({
        status: 'success',
        data: applications,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Job not found') {
          res.status(404).json({
            status: 'error',
            message: error.message,
          });
        } else if (error.message === 'You can only view applications for your own jobs') {
          res.status(403).json({
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

  async updateApplicationStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { status } = req.body as UpdateApplicationStatusBody;
      const application = await applicationService.updateApplicationStatus(
        id,
        req.user!.id,
        status
      );
      res.status(200).json({
        status: 'success',
        data: application,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Application not found') {
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

  async getClientApplications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const applications = await applicationService.getClientApplications(req.user!.id);
      res.status(200).json({
        status: 'success',
        data: applications,
      });
    } catch (error) {
      next(error);
    }
  }
}