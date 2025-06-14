/**
 * OpenAI Realtime API Server Event Types
 * @packageDocumentation
 */

import {
  EventId,
  SessionConfig,
  Item,
  TranscriptionSessionConfig,
} from './core';

export enum ServerEventType {
  SESSION_UPDATED = 'session.updated',
  INPUT_AUDIO_BUFFER_COMMITTED = 'input_audio_buffer.committed',
  INPUT_AUDIO_BUFFER_CLEARED = 'input_audio_buffer.cleared',
  CONVERSATION_ITEM_CREATED = 'conversation.item.created',
  CONVERSATION_ITEM_RETRIEVED = 'conversation.item.retrieved',
  CONVERSATION_ITEM_TRUNCATED = 'conversation.item.truncated',
  CONVERSATION_ITEM_DELETED = 'conversation.item.deleted',
  RESPONSE_CREATED = 'response.created',
  RESPONSE_DONE = 'response.done',
  RESPONSE_CANCELLED = 'response.cancelled',
  TRANSCRIPTION_SESSION_UPDATED = 'transcription_session.updated',
  OUTPUT_AUDIO_BUFFER_CLEARED = 'output_audio_buffer.cleared',
  ERROR = 'error',
}

// Error Types
export enum ErrorType {
  INVALID_REQUEST_ERROR = 'invalid_request_error',
  SERVER_ERROR = 'server_error',
}

export interface ErrorDetails {
  type: ErrorType;
  code?: string | null;
  message: string;
  param?: string | null;
  event_id?: string | null; // The event_id of the client event that caused the error
}

export interface ErrorEvent {
  event_id: EventId;
  type: ServerEventType.ERROR;
  error: ErrorDetails;
}

export interface SessionUpdatedEvent {
  event_id?: EventId;
  type: ServerEventType.SESSION_UPDATED;
  session: SessionConfig;
}

export interface TranscriptionSessionUpdatedEvent {
  event_id?: EventId;
  type: ServerEventType.TRANSCRIPTION_SESSION_UPDATED;
  session: TranscriptionSessionConfig;
}

export interface InputAudioBufferCommittedEvent {
  event_id?: EventId;
  type: ServerEventType.INPUT_AUDIO_BUFFER_COMMITTED;
}

export interface InputAudioBufferClearedEvent {
  event_id?: EventId;
  type: ServerEventType.INPUT_AUDIO_BUFFER_CLEARED;
}

export interface ConversationItemCreatedEvent {
  event_id?: EventId;
  type: ServerEventType.CONVERSATION_ITEM_CREATED;
  item: Item;
}

export interface ConversationItemRetrievedEvent {
  event_id?: EventId;
  type: ServerEventType.CONVERSATION_ITEM_RETRIEVED;
  item: Item;
}

export interface ConversationItemTruncatedEvent {
  event_id?: EventId;
  type: ServerEventType.CONVERSATION_ITEM_TRUNCATED;
  item: Item;
}

export interface ConversationItemDeletedEvent {
  event_id?: EventId;
  type: ServerEventType.CONVERSATION_ITEM_DELETED;
  item_id: string;
}

export interface ResponseCreatedEvent {
  event_id?: EventId;
  type: ServerEventType.RESPONSE_CREATED;
  response_id: string;
}

export interface ResponseDoneEvent {
  event_id?: EventId;
  type: ServerEventType.RESPONSE_DONE;
  response_id: string;
}

export interface ResponseCancelledEvent {
  event_id?: EventId;
  type: ServerEventType.RESPONSE_CANCELLED;
  response_id: string;
}

export interface OutputAudioBufferClearedEvent {
  event_id?: EventId;
  type: ServerEventType.OUTPUT_AUDIO_BUFFER_CLEARED;
}

// Union type for all server events
export type ServerEvent =
  | SessionUpdatedEvent
  | TranscriptionSessionUpdatedEvent
  | InputAudioBufferCommittedEvent
  | InputAudioBufferClearedEvent
  | ConversationItemCreatedEvent
  | ConversationItemRetrievedEvent
  | ConversationItemTruncatedEvent
  | ConversationItemDeletedEvent
  | ResponseCreatedEvent
  | ResponseDoneEvent
  | ResponseCancelledEvent
  | OutputAudioBufferClearedEvent
  | ErrorEvent;
