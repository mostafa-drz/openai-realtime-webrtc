import type { Metadata } from 'next';
import './globals.css';
import { OpenAIRealtimeWebRTCProvider } from './context/OpenAIRealtimeWebRTC';
import {
  Modality,
  OpenAIRealtimeContextConfig,
  TurnDetectionType,
  Voice,
} from './types';

export const metadata: Metadata = {
  title: 'OpenAI Realtime WebRTC',
  description: 'OpenAI Realtime WebRTC',
};

// Default configuration that can be overridden by the ConfigurationPanel
const defaultConfig: OpenAIRealtimeContextConfig = {
  realtimeApiUrl: 'https://api.openai.com/v1/realtime',
  modelId: 'gpt-4o-realtime-preview-2024-12-17',
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        <OpenAIRealtimeWebRTCProvider config={defaultConfig}>
          {children}
        </OpenAIRealtimeWebRTCProvider>
      </body>
    </html>
  );
}
