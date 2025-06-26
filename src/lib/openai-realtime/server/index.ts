import { SessionConfig, CreateSessionResponse } from '../types';

export interface ServerRealtimeClientConfig {
  baseUrl: string;
}

export const defaultServerRealtimeClientConfig: ServerRealtimeClientConfig = {
  baseUrl: 'https://api.openai.com/v1/realtime/sessions',
};

export async function createSession(
  config: SessionConfig,
  options: Partial<ServerRealtimeClientConfig> = {}
): Promise<CreateSessionResponse> {
  const baseUrl = options.baseUrl || defaultServerRealtimeClientConfig.baseUrl;

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
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
