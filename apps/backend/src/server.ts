import { env, setupExpressApp } from './config';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import express from 'express';
import { setupSocketIoHooks } from './io-hooks';
import { router } from './routes';
import { makePresentations } from '@/presentation-factory';
import { addTraceId, createChildLogger } from './config/logger';

const { api } = env;

const app = express();

const logger = createChildLogger('Server');

setupExpressApp(app);
app.use(addTraceId); // Add trace ID middleware
app.use(router);

export const server = createServer(app);

export const io = new Server(server, {
  connectionStateRecovery: {},
  cors: {
    origin: api.corsOrigins,
    allowedHeaders: api.corsAllowedHeaders,
  },
});

const init = async () => {
  const { orchestrator, notifier } = await makePresentations();

  setupSocketIoHooks(io, orchestrator);

  const expressServer = server.listen(api.port, () => {
    createChildLogger('Server').info('Server is running', { port: api.port });
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

      orchestrator.destroy();
      notifier.destroy();
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
      logger.error('Error during graceful shutdown', {
        error: (error as Error).message,
      });
      process.exit(1);
    }
  });
};

init().catch((error) => {
  logger.error('Server initialization failed', {
    error: (error as Error).message,
  });
});
