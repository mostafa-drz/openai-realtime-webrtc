import { LogLevel, LogMessage, Logger } from '../types';

const createLogMessage = (
  level: LogLevel,
  message: string,
  meta?: { sessionId?: string; data?: unknown; error?: Error }
): LogMessage => ({
  level,
  message,
  sessionId: meta?.sessionId,
  timestamp: new Date().toISOString(),
  data: meta?.data,
  error: meta?.error,
});

export const createNoopLogger = (): Logger => ({
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
});

export const createConsoleLogger = (): Logger => ({
  debug: (message, meta) => {
    console.debug(createLogMessage(LogLevel.DEBUG, message, meta));
  },
  info: (message, meta) => {
    console.info(createLogMessage(LogLevel.INFO, message, meta));
  },
  warn: (message, meta) => {
    console.warn(createLogMessage(LogLevel.WARN, message, meta));
  },
  error: (message, meta) => {
    console.error(createLogMessage(LogLevel.ERROR, message, meta));
  },
});

// Optional: Create a default logger that can be used throughout the application
export const defaultLogger =
  process.env.NODE_ENV === 'development'
    ? createConsoleLogger()
    : createNoopLogger();
