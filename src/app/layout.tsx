'use client';

import './globals.css';
import { Logger, LogLevel } from './types';

// Move the logger creation to a client component
const ClientProvider = ({ children }: { children: React.ReactNode }) => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const createFancyLogger = (): Logger => {
    const styles = {
      [LogLevel.DEBUG]: 'color: #808080', // gray
      [LogLevel.INFO]: 'color: #0066cc', // blue
      [LogLevel.WARN]: 'color: #ff9900', // orange
      [LogLevel.ERROR]: 'color: #cc0000', // red
    };

    const formatMessage = (
      level: LogLevel,
      message: string,
      meta?: { [key: string]: unknown }
    ) => {
      const timestamp = new Date().toISOString();
      const sessionInfo = meta?.sessionId ? `[Session: ${meta.sessionId}]` : '';
      return [
        `%c${timestamp} ${level} ${sessionInfo} ${message}`,
        styles[level],
        meta?.data ? '\nData:' + JSON.stringify(meta.data) : '',
        meta?.error ? '\nError:' + JSON.stringify(meta.error) : '',
      ];
    };

    return {
      debug: (message, meta) => {
        if (process.env.NODE_ENV === 'development') {
          console.debug(...formatMessage(LogLevel.DEBUG, message, meta));
        }
      },
      info: (message, meta) => {
        console.info(...formatMessage(LogLevel.INFO, message, meta));
      },
      warn: (message, meta) => {
        console.warn(...formatMessage(LogLevel.WARN, message, meta));
      },
      error: (message, meta) => {
        console.error(...formatMessage(LogLevel.ERROR, message, meta));
        // Could also send errors to an error tracking service like Sentry
        if (meta?.error) {
          // reportErrorToService(meta.error);
        }
      },
    };
  };

  return <>{children}</>;
};

// Keep the RootLayout as a server component
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        <ClientProvider>{children}</ClientProvider>
      </body>
    </html>
  );
}
