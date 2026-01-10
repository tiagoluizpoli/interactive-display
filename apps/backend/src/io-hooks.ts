import type { DefaultEventsMap, Server } from 'socket.io';

import { createChildLogger } from './config/logger';

export const setupSocketIoHooks = (io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) => {
  io.on('connection', (socket) => {
    const socketLogger = createChildLogger('IoHooks', { socketId: socket.id });

    socketLogger.info('User connected', { socketId: socket.id });

    socket.on('disconnect', () => {
      socketLogger.info('User disconnected', { socketId: socket.id });
    });
  });
};
