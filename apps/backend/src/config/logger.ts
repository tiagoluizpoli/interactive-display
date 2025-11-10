import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { AsyncLocalStorage } from 'node:async_hooks';
import { env } from './env';

const { combine, timestamp, json } = winston.format;

interface LogContext {
  traceId?: string;
}

const asyncLocalStorage = new AsyncLocalStorage<LogContext>();

const createLogger = (defaultMeta?: Record<string, any>) => {
  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: json(), // Ensure console output is pure JSON, timestamp is already in main format
    }),
  ];

  return winston.createLogger({
    level: env.baseConfig.nodeEnv === 'development' ? 'debug' : 'info',
    format: combine(
      timestamp(),
      // Add a custom format to include _level_name before JSON serialization
      winston.format((info) => {
        info._level_name = info.level; // Store the string level
        return info;
      })(),
      json(), // Use JSON format for all logging
    ),
    transports,
    defaultMeta, // Set default metadata for all logs from this logger instance
  });
};

export const logger = createLogger(); // Default logger without specific context

// Middleware to add a trace ID to each request
export const addTraceId = (req: any, _: any, next: any) => {
  const traceId = uuidv4();
  asyncLocalStorage.run({ traceId }, () => {
    req.traceId = traceId; // Also attach to req for direct access if needed
    next();
  });
};

// Function to create a child logger with specific context
export const createChildLogger = (layer: string, defaultMeta?: Record<string, any>) => {
  const store = asyncLocalStorage.getStore();
  const meta: Record<string, any> = { layer, ...defaultMeta };
  if (store?.traceId) {
    meta.traceId = store.traceId;
  }
  return logger.child(meta);
};
