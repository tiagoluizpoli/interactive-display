import type { Server, DefaultEventsMap } from 'socket.io';

export const setupIoHooks = (io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) => {
  io.on('connection', (socket) => {
    console.log(`user connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`user Disconnected: ${socket.id}`);
    });
  });
};
