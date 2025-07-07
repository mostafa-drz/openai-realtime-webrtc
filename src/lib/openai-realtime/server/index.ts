import {
  SessionConfig,
  CreateSessionResponse,
  TranscriptionSessionConfig,
  CreateTranscriptionSessionResponse,
} from '../types';

export interface ServerRealtimeClientConfig {
  baseUrl: string;
  transcriptionBaseUrl: string;
  apiKey: string;
}

export const defaultServerRealtimeClientConfig: ServerRealtimeClientConfig = {
  baseUrl:
    process.env.OPENAI_REALTIME_SESSION_URL ||
    'https://api.openai.com/v1/realtime/sessions',
  transcriptionBaseUrl:
    process.env.OPENAI_REALTIME_TRANSCRIPTION_SESSION_URL ||
    'https://api.openai.com/v1/realtime/transcription_sessions',
  apiKey: process.env.OPENAI_API_KEY || '',
};

export async function createSession(
  config: SessionConfig,
  options: Partial<ServerRealtimeClientConfig> = {}
): Promise<CreateSessionResponse> {
  const baseUrl = options.baseUrl || defaultServerRealtimeClientConfig.baseUrl;
  const apiKey = options.apiKey || defaultServerRealtimeClientConfig.apiKey;

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    throw new Error(`OpenAI session creation failed: ${await response.text()}`);
  }

  const data: CreateSessionResponse = await response.json();
  return data;
}

export async function createTranscriptionSession(
  config: TranscriptionSessionConfig,
  options: Partial<ServerRealtimeClientConfig> = {}
): Promise<CreateTranscriptionSessionResponse> {
  const baseUrl =
    options.transcriptionBaseUrl ||
    defaultServerRealtimeClientConfig.transcriptionBaseUrl;
  const apiKey = options.apiKey || defaultServerRealtimeClientConfig.apiKey;

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    throw new Error(
      `OpenAI transcription session creation failed: ${await response.text()}`
    );
  }

  const data: CreateTranscriptionSessionResponse = await response.json();
  return data;
}
