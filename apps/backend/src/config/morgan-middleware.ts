import morgan from 'morgan';
import { logger } from './logger';

// export const morganMiddleware = morgan(':method: :url :status :res[content-length] - :response-time ms', {
//   stream: {
//     write: (message) => logger.http(message.trim()),
//   },
// });

export const morganMiddleware = morgan(
  (tokens, req, res) => {
    return JSON.stringify({
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: tokens.status(req, res),
      contentLength: tokens.res(req, res, 'content-length'),
      responseTime: tokens['response-time'](req, res),
      totalTime: tokens['total-time'](req, res),
    });
  },
  {
    stream: {
      write: (message) => logger.http(JSON.parse(message)),
    },
  },
);
