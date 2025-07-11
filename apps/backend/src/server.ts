import { env, setupExpressApp } from './config';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import express from 'express';
import { setupSocketIoHooks } from './io-hooks';
import { router } from './routes';
import { makePresentations } from '@/present-factory';

const { port, cors } = env.baseConfig.api;

const app = express();

setupExpressApp(app);
app.use(router);

export const server = createServer(app);

export const io = new Server(server, {
  connectionStateRecovery: {},
  cors: {
    origin: cors.origin,
  },
});

const presentations = makePresentations();

setupSocketIoHooks(io, presentations);

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

init()
  .then(() => {
    presentations.execute();
  })
  .catch(console.error);
