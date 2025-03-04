'use client';

import './globals.css';
import { OpenAIRealtimeWebRTCProvider } from './context/OpenAIRealtimeWebRTC';
import {
  Modality,
  OpenAIRealtimeContextConfig,
  TurnDetectionType,
  Voice,
  Logger,
  LogLevel,
} from './types';

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

  const defaultConfig: OpenAIRealtimeContextConfig = {
    realtimeApiUrl: 'https://api.openai.com/v1/realtime',
    modelId: 'gpt-4o-realtime-preview-2024-12-17',
    // logger: createFancyLogger(), // Create logger on the client side
    // logger: console,
    logger: {
      debug: () => {},
      info: () => {},
      warn: () => {},
      error: (...all) => {
        console.error(...all);
      },
    },
    defaultSessionConfig: {
      modalities: [Modality.TEXT, Modality.AUDIO],
      input_audio_transcription: {
        model: 'whisper-1',
      },
      voice: Voice.ALLOY,
      instructions: `
        You are a fortune teller. You can see the future.
      `,
      turn_detection: {
        type: TurnDetectionType.SERVER_VAD,
        threshold: 0.5,
        prefix_padding_ms: 300,
        silence_duration_ms: 500,
      },
      connection_timeout: 10000,
    },
    defaultAudioSettings: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: 48000,
    },
    defaultIceTimeout: 30000,
  };

  return (
    <OpenAIRealtimeWebRTCProvider config={defaultConfig}>
      {children}
    </OpenAIRealtimeWebRTCProvider>
  );
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
