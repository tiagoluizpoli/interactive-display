import { createServer } from 'node:http';
import express from 'express';
import { Server } from 'socket.io';
import { env, setupExpressApp } from './config';
import { setupSocketIoHooks } from './io-hooks';
import { makePresent } from './present-factory';
import { router } from './routes';

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

const present = makePresent();
setupSocketIoHooks(io, present);

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
    present.execute();
  })
  .catch(console.error);
