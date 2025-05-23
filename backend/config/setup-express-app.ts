import cors from 'cors';
import express, { type Express } from 'express';
import logger from 'morgan';
import { env } from './env';

const logOptions: Record<string, (app: Express) => void> = {
  debug: (app) => app.use(logger('combined')),
  dev: (app) => app.use(logger('dev')),
  prod: (app) =>
    app.use(
      logger('combined', {
        skip: (_, res) => res.statusCode < 400,
      }),
    ),
};

const { loggerLevel, cors: envCors } = env.baseConfig.api;

export const setupExpressApp = (app: Express) => {
  app.use(express.json());

  app.use(
    cors({
      origin: envCors.origin,
    }),
  );

  logOptions[loggerLevel](app);
};
