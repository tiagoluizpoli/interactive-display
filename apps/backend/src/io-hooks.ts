import type { DefaultEventsMap, Server } from 'socket.io';
import type { LocalPersistence } from './presentations';
import { createChildLogger } from './config/logger';

export const setupSocketIoHooks = (
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  localPersistence?: LocalPersistence,
) => {
  io.on('connection', (socket) => {
    const socketLogger = createChildLogger('IoHooks', { socketId: socket.id });

    socketLogger.info('User connected', { socketId: socket.id });

    localPersistence?.emit();

    socket.on('disconnect', () => {
      socketLogger.info('User disconnected', { socketId: socket.id });
    });
  });
};
