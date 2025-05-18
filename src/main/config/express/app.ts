import express, { type Express } from 'express';
import cors from 'cors';
import logger from 'morgan';
import { env } from '../env';
import { router } from '../../routes';

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

export const setupApp = (app: Express) => {
  app.use(express.json());

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN || '*',
      allowedHeaders: ['*'],
    }),
  );

  const { loggerLevel } = env.baseConfig.api;

  logOptions[loggerLevel](app);

  app.use(router);
};
