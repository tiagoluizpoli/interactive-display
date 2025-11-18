import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';
import { AsyncLocalStorage } from 'node:async_hooks';
import { env } from './env';

const { combine, timestamp, json, colorize } = winston.format;

interface LogContext {
  traceId?: string;
}

const asyncLocalStorage = new AsyncLocalStorage<LogContext>();

const createLogger = (defaultMeta?: Record<string, any>) => {
  const logFormat = winston.format.printf((info) => {
    const { timestamp, level, layer, message, ...rest } = info;
    const restKeys = Object.keys(rest);

    return `${timestamp}-${level} [${layer}]: ${JSON.stringify(message)} ${restKeys.length ? `:: ${JSON.stringify(rest)}` : ''}\n`;
  });

  const transports: winston.transport[] = [
    new winston.transports.Console({ format: combine(timestamp(), colorize(), logFormat) }),
  ];

  return winston.createLogger({
    level: env.baseConfig.nodeEnv === 'development' ? 'debug' : 'info',
    format: combine(timestamp(), json()),
    transports,
    defaultMeta, // Set default metadata for all logs from this logger instance
  });
};

export const logger = createLogger(); // Default logger without specific context

// Function to create a child logger with specific context
export const createChildLogger = (layer: string, defaultMeta?: Record<string, any>) => {
  const store = asyncLocalStorage.getStore();
  const meta: Record<string, any> = { layer, ...defaultMeta };
  if (store?.traceId) {
    meta.traceId = store.traceId;
  }
  return logger.child(meta);
};

// Middleware to add a trace ID to each request
export const addTraceId = (req: any, _: any, next: any) => {
  const traceId = uuidv4();
  asyncLocalStorage.run({ traceId }, () => {
    req.traceId = traceId; // Also attach to req for direct access if needed
    next();
  });
};
