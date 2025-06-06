import type { DefaultEventsMap, Server } from 'socket.io';
import type { LocalPersistence } from './presentations';

export const setupSocketIoHooks = (
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  localPersistence: LocalPersistence,
) => {
  io.on('connection', (socket) => {
    console.log(`user connected: ${socket.id}`);

    localPersistence.emit();

    socket.on('disconnect', () => {
      console.log(`user Disconnected: ${socket.id}`);
    });
  });
};
