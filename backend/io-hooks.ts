import type { Server, DefaultEventsMap } from 'socket.io';
import type { Present } from './present';

export const setupSocketIoHooks = (
  io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>,
  present: Present,
) => {
  io.on('connection', (socket) => {
    console.log(`user connected: ${socket.id}`);

    present.emitCurrentPresentation();

    socket.on('disconnect', () => {
      console.log(`user Disconnected: ${socket.id}`);
    });
  });
};
