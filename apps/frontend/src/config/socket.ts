import { io } from 'socket.io-client';
import { env } from './env';

const { baseUrl } = env.baseConfig;

export const socket = io(baseUrl, {
  transports: ['websocket'],
});

socket.on('connect', () => {
  console.log(`Connected to server with the id: ${socket.id}`);
});
