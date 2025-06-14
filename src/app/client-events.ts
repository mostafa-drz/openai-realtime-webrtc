/**
 * OpenAI Realtime API Client Event Types
 * @packageDocumentation
 */

import { EventId, SessionConfig } from './types-new';

export enum ClientEventType {
  SESSION_UPDATE = 'session.update',
  INPUT_AUDIO_BUFFER_APPEND = 'input_audio_buffer.append',
  INPUT_AUDIO_BUFFER_COMMIT = 'input_audio_buffer.commit',
  INPUT_AUDIO_BUFFER_CLEAR = 'input_audio_buffer.clear',
}

export interface SessionUpdateEvent {
  event_id?: EventId;
  type: ClientEventType.SESSION_UPDATE;
  session: SessionConfig;
}

export interface InputAudioBufferAppendEvent {
  event_id?: EventId;
  type: ClientEventType.INPUT_AUDIO_BUFFER_APPEND;
  audio: string; // Base64-encoded audio bytes in the format specified by input_audio_format
}

export interface InputAudioBufferCommitEvent {
  event_id?: EventId;
  type: ClientEventType.INPUT_AUDIO_BUFFER_COMMIT;
}

export interface InputAudioBufferClearEvent {
  event_id?: EventId;
  type: ClientEventType.INPUT_AUDIO_BUFFER_CLEAR;
}

// Union type for all client events
export type ClientEvent =
  | SessionUpdateEvent
  | InputAudioBufferAppendEvent
  | InputAudioBufferCommitEvent
  | InputAudioBufferClearEvent;

// Add more client event types here as they become available
