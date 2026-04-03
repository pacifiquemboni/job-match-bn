// src/index.ts
import 'dotenv/config';
import app from './app';
import { createServer } from 'http';
import { Server } from 'socket.io';

import logger from './utils/logger';
import { setupSocketHandlers } from './socket';

const PORT = process.env.PORT || 3010;

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  },
});

// Setup Socket.IO handlers
setupSocketHandlers(io);

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});