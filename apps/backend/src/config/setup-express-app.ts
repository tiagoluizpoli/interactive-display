import cors from 'cors';
import express, { type Express } from 'express';

import { morganMiddleware } from './morgan-middleware';

export const setupExpressApp = (app: Express) => {
  app.use(morganMiddleware);
  app.use(express.json());

  app.use(cors());
};
