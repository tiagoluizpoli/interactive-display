import type { Server, DefaultEventsMap } from 'socket.io';
import { makePresentSlide } from '../../factories/usecases';

export const setupIoHooks = (io: Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>) => {
  io.on('connection', (socket) => {
    console.log(`user connected: ${socket.id}`);

    const presentSlide = makePresentSlide();
    presentSlide.execute();

    socket.on('disconnect', () => {
      console.log(`user Disconnected: ${socket.id}`);
    });
  });
};
