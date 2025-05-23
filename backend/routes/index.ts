import express, { Router } from 'express';
import path from 'node:path';
import { io } from '../server';

export const router = Router();

router.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to the API',
  });
});

router.get('/send-message', (req, res) => {
  io.emit('message', {
    message: 'Hello from the server',
    date: new Date(),
  });

  res.status(200).json({
    message: 'Message sent',
  });
});

router.use('/websocketui', express.static(path.join(__dirname, 'public')));

const staticPath = path.join(__dirname, '..', '..', 'files');
router.use('/files', express.static(staticPath));
