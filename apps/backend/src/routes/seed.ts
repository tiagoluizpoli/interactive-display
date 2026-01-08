import { seed } from '@/db/seed-command';
import { HttpStatusCode } from 'axios';
import { Router } from 'express';

export const seedRoutes = Router();

seedRoutes.post('/', async (_, res) => {
  await seed();

  res.status(HttpStatusCode.Ok).json({
    message: 'Database seeded successfully',
  });
});
