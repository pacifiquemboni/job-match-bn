// src/utils/validation.ts
import { plainToClass } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { Request, Response, NextFunction } from 'express';
import { CreateApplicationDto } from '../validators/CreateApplicationDto';
import { CreateJobDto } from '../validators/CreateJobDto';
import { CreateMessageDto } from '../validators/CreateMessageDto';
import { LoginDto } from '../validators/loginDto';
import { RegisterDto } from '../validators/RegisterDto';
import { SearchJobsDto } from '../validators/searchJobDto';
import { UpdateApplicationStatusDto } from '../validators/updateApplicationStatusDto';


const validators = {
  register: RegisterDto,
  login: LoginDto,
  createJob: CreateJobDto,
  searchJobs: SearchJobsDto,
  createApplication: CreateApplicationDto,
  updateApplicationStatus: UpdateApplicationStatusDto,
  createMessage: CreateMessageDto,
};

export const validateRequest = (type: keyof typeof validators) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const dtoClass = validators[type];
    const dtoObject = plainToClass(dtoClass as any, req.body);
    const errors = await validate(dtoObject);

    if (errors.length > 0) {
      const formattedErrors = errors.map((error: ValidationError) => ({
        property: error.property,
        constraints: error.constraints,
      }));
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }

    req.body = dtoObject;
    next();
  };
};