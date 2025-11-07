import { env, setupExpressApp } from './config';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import express from 'express';
import { setupSocketIoHooks } from './io-hooks';
import { router } from './routes';
import { makePresentations } from '@/present-factory';
import type { LocalPersistence } from '@/presentations';
import { addTraceId, createChildLogger } from './config/logger';

const { port, cors } = env.baseConfig.api;

const app = express();

const logger = createChildLogger('Server');

setupExpressApp(app);
app.use(addTraceId); // Add trace ID middleware
app.use(router);

export const server = createServer(app);

export const io = new Server(server, {
  connectionStateRecovery: {},
  cors: {
    origin: cors.origin,
  },
});

let presentations: LocalPersistence;

const init = async () => {
  presentations = await makePresentations();
  setupSocketIoHooks(io, presentations);

  const expressServer = server.listen(port, () => {
    createChildLogger('Server').info('Server is running', { port });
  });

  process.on('SIGINT', async () => {
    logger.info('Received SIGINT signal. Starting graceful shutdown...');
    try {
      await new Promise<void>((resolve, reject) => {
        expressServer.close((err) => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
      logger.info('Express server closed');

      await presentations.destroy();
      logger.info('Presentations resources destroyed');

      await new Promise<void>((resolve, reject) => {
        io.close((err) => {
          if (err) {
            return reject(err);
          }
          resolve();
        });
      });
      logger.info('Socket server closed');

      logger.info('API server closed. Exiting process.');
      process.exit(0);
    } catch (error) {
      logger.error('Error during graceful shutdown', { error: (error as Error).message });
      process.exit(1);
    }
  });
};

init()
  .then(async () => {   
    await presentations.execute();
  })
  .catch((error) => {
    logger.error('Server initialization failed', { error: (error as Error).message });
  });
