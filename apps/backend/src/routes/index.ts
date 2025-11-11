import { Router } from 'express';
import { io } from '../server';
import { configRoutes } from './config';

export const router = Router();

router.use('/config', configRoutes);

router.get('/', (_, res) => {
  res.status(200).json({
    message: 'Welcome to the API',
  });
});

router.get('/send-message', (_, res) => {
  io.emit('message', {
    message: 'Hello from the server',
    date: new Date(),
  });

  res.status(200).json({
    message: 'Message sent',
  });
});
