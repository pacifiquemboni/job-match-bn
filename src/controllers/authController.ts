// src/controllers/authController.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { RegisterBody, LoginBody } from '../types';
import logger from '../utils/logger';

const authService = new AuthService();

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body as RegisterBody;
      const result = await authService.register(data);
      res.status(201).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Email already registered') {
        res.status(409).json({
          status: 'error',
          message: error.message,
        });
      } else {
        next(error);
      }
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body as LoginBody;
      const result = await authService.login(data);
      res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid credentials') {
        res.status(401).json({
          status: 'error',
          message: error.message,
        });
      } else {
        next(error);
      }
    }
  }
}