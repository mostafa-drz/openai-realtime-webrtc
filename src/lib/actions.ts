'use server';

import { createSession } from '@/lib/openai-realtime/server';
import {
  SessionConfig,
  CreateSessionResponse,
} from '@/lib/openai-realtime/types';

export async function createRealtimeSession(config: SessionConfig) {
  try {
    console.log('Creating session with config:', config);
    // Validate required fields
    if (!config.model) {
      throw new Error('Model is required');
    }

    // Create the session using the server module
    const session: CreateSessionResponse = await createSession(config);

    // Return the client secret and session info
    return {
      success: true,
      sessionId: session.id,
      clientSecret: session.client_secret.value,
      expiresAt: session.client_secret.expires_at,
      config: {
        model: session.model,
        voice: session.voice,
        temperature: session.temperature,
        speed: session.speed,
      },
    };
  } catch (error) {
    console.error('Session creation error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
