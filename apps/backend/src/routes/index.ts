import path from 'node:path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { Router } from 'express';
import { io } from '../server';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const router = Router();

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

const staticPath = path.join(__dirname, '..', '..', 'files');
console.log('staticPath', staticPath);

router.use('/files', express.static('D:/files'));
