// src/types/index.ts
import { Request } from 'express';
import { User, UserRole, ApplicationStatus, JobStatus } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export interface RegisterBody {
  email: string;
  password: string;
  role: UserRole;
  skills?: string[];
  bio?: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface CreateJobBody {
  title: string;
  description: string;
  budget: number;
  tags: string[];
}

export interface SearchJobsQuery {
  page?: string;
  limit?: string;
  tags?: string | string[];
  status?: JobStatus;
  minBudget?: string | number;
  maxBudget?: string | number;
}

export interface CreateApplicationBody {
  jobId: string;
}

export interface UpdateApplicationStatusBody {
  status: ApplicationStatus;
}

export interface UpdateJobStatusBody {
  status: JobStatus;
}

export interface CreateMessageBody {
  applicationId: string;
  content: string;
}

export interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
}