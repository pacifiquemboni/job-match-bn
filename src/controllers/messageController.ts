// src/controllers/messageController.ts
import { Response, NextFunction } from 'express';
import { MessageService } from '../services/messageService';
import { AuthenticatedRequest, CreateMessageBody } from '../types';
import logger from '../utils/logger';

const messageService = new MessageService();

export class MessageController {
  async sendMessage(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { applicationId, content } = req.body as CreateMessageBody;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
      }

      const message = await messageService.sendMessage(
        userId,
        applicationId,
        content
      );
      res.status(201).json({
        status: 'success',
        data: message,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Application not found') {
          res.status(404).json({
            status: 'error',
            message: error.message,
          });
        } else if (error.message.includes('not authorized') ||
                   error.message.includes('only allowed')) {
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

  async getMessages(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { applicationId } = req.params;
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
      }

      const messages = await messageService.getMessages(applicationId, userId);
      // Mark incoming messages as read now that the user has fetched them
      await messageService.markMessagesAsRead(applicationId, userId);
      res.status(200).json({
        status: 'success',
        data: messages,
      });
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Application not found') {
          res.status(404).json({
            status: 'error',
            message: error.message,
          });
        } else if (error.message.includes('not authorized')) {
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

  async getConversations(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id;
      
      if (!userId) {
        return res.status(401).json({
          status: 'error',
          message: 'User not authenticated',
        });
      }

      const conversations = await messageService.getUserConversations(userId);
      res.status(200).json({
        status: 'success',
        data: conversations,
      });
    } catch (error) {
      logger.error('Error getting conversations:', error);
      next(error);
    }
  }
}