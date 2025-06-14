/**
 * OpenAI Realtime API Server Event Types
 * @packageDocumentation
 */

import { EventId, SessionConfig } from './types-new';

export enum ServerEventType {
  SESSION_UPDATED = 'session.updated',
  INPUT_AUDIO_BUFFER_COMMITTED = 'input_audio_buffer.committed',
  INPUT_AUDIO_BUFFER_CLEARED = 'input_audio_buffer.cleared',
}

export interface SessionUpdatedEvent {
  event_id?: EventId;
  type: ServerEventType.SESSION_UPDATED;
  session: SessionConfig;
}

export interface InputAudioBufferCommittedEvent {
  event_id?: EventId;
  type: ServerEventType.INPUT_AUDIO_BUFFER_COMMITTED;
}

export interface InputAudioBufferClearedEvent {
  event_id?: EventId;
  type: ServerEventType.INPUT_AUDIO_BUFFER_CLEARED;
}

// Union type for all server events
export type ServerEvent =
  | SessionUpdatedEvent
  | InputAudioBufferCommittedEvent
  | InputAudioBufferClearedEvent;

// Add more server event types here as they become available
