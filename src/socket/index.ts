// src/socket/index.ts
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import { MessageService } from '../services/messageService';
import { setSocketInstance } from './notifications';
import logger from '../utils/logger';

const messageService = new MessageService();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export const setupSocketHandlers = (io: Server) => {
  // Set socket instance for notifications
  setSocketInstance(io);

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      socket.userId = decoded.id;
      socket.userRole = decoded.role;
      logger.info(`Socket authenticated for user ${socket.userId}`);
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    logger.info(`User ${socket.userId} connected with socket ${socket.id}`);

    // Join user-specific room for notifications
    socket.join(`user:${socket.userId}`);
    logger.info(`User ${socket.userId} joined notification room`);

    socket.on('join-room', async (applicationId: string) => {
      try {
        logger.info(`User ${socket.userId} joining room application:${applicationId}`);
        
        // Verify user has access to this application
        const application = await prisma.application.findUnique({
          where: { id: applicationId },
          include: {
            job: true,
            worker: true,
          },
        });

        if (!application) {
          logger.warn(`Application ${applicationId} not found`);
          socket.emit('error', 'Application not found');
          return;
        }

        const isWorker = application.workerId === socket.userId;
        const isClient = application.job.clientId === socket.userId;

        if (!isWorker && !isClient) {
          logger.warn(`User ${socket.userId} unauthorized for application ${applicationId}`);
          socket.emit('error', 'Unauthorized to join this room');
          return;
        }

        socket.join(`application:${applicationId}`);
        logger.info(`User ${socket.userId} successfully joined room application:${applicationId}`);
        socket.emit('joined-room', applicationId);
      } catch (error) {
        logger.error('Error joining room:', error);
        socket.emit('error', 'Failed to join room');
      }
    });

    socket.on('send-message', async (data: { applicationId: string; content: string }) => {
      try {
        logger.info(`Message from ${socket.userId} in application ${data.applicationId}: ${data.content.substring(0, 50)}...`);
        
        const message = await messageService.sendMessage(
          socket.userId!,
          data.applicationId,
          data.content
        );

        logger.info(`Message saved with id ${message.id}`);

        // Broadcast to all users in the room
        io.to(`application:${data.applicationId}`).emit('new-message', message);
        logger.info(`Message broadcast to application:${data.applicationId}`);
      } catch (error) {
        logger.error('Error sending message:', error);
        socket.emit('error', error instanceof Error ? error.message : 'Failed to send message');
      }
    });

    socket.on('leave-room', (applicationId: string) => {
      socket.leave(`application:${applicationId}`);
      logger.info(`User ${socket.userId} left room application:${applicationId}`);
    });

    socket.on('disconnect', () => {
      logger.info(`User ${socket.userId} disconnected`);
    });

    socket.on('getUnreadCount', async () => {
      try {
        const count = await prisma.message.count({
          where: {
            application: {
              OR: [
                { workerId: socket.userId },
                { job: { clientId: socket.userId } },
              ],
            },
            senderId: { not: socket.userId },
            read: false,
          },
        });
        socket.emit('unreadCount', count);
        logger.info(`Sent unread count ${count} to user ${socket.userId}`);
      } catch (error) {
        logger.error('Error getting unread count:', error);
        socket.emit('unreadCount', 0);
      }
    });
  });
};