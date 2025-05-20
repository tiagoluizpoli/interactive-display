import { env, setupApp, setupIoHooks } from './config';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import express from 'express';

const { port } = env.baseConfig.api;

const app = express();

setupApp(app);

export const server = createServer(app);

export const io = new Server(server, {
  connectionStateRecovery: {},
});

setupIoHooks(io);

const init = async () => {
  const expressServer = server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });

  process.on('SIGINT', () => {
    expressServer.close(() => {
      io.close(() => {
        console.log('Socket server closed');
      });

      console.log('API server closed');

      process.exit(0);
    });
  });
};

init().catch(console.error);
