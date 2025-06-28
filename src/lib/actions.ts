'use server';

import {
  createSession,
  createTranscriptionSession,
} from '@/lib/openai-realtime/server';
import {
  SessionConfig,
  CreateSessionResponse,
  TranscriptionSessionConfig,
  CreateTranscriptionSessionResponse,
} from '@/lib/openai-realtime/types';

export async function createRealtimeSession(config: SessionConfig) {
  try {
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

export async function createRealtimeTranscriptionSession(
  config: TranscriptionSessionConfig
) {
  try {
    // Validate required fields
    if (!config.input_audio_transcription?.model) {
      throw new Error('Transcription model is required');
    }

    // Create the transcription session using the server module
    const session: CreateTranscriptionSessionResponse =
      await createTranscriptionSession(config);

    // Return the client secret and session info
    return {
      success: true,
      sessionId: session.id,
      clientSecret: session.client_secret.value,
      expiresAt: session.client_secret.expires_at,
      config: {
        input_audio_transcription: session.input_audio_transcription,
        turn_detection: session.turn_detection,
        input_audio_format: session.input_audio_format,
      },
    };
  } catch (error) {
    console.error('Transcription session creation error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
