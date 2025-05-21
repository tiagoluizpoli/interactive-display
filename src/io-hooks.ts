import type { Server, DefaultEventsMap } from 'socket.io';
import { makePresent } from './present-factory';

export const setupSocketIoHooks = (io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) => {
  const present = makePresent();

  io.on('connection', (socket) => {
    console.log(`user connected: ${socket.id}`);

    present.execute();

    socket.on('disconnect', () => {
      console.log(`user Disconnected: ${socket.id}`);
    });
  });
};
