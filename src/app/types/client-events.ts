/**
 * OpenAI Realtime API Client Event Types
 * @packageDocumentation
 */

import {
  EventId,
  SessionConfig,
  Item,
  ResponseConfig,
  TranscriptionSessionConfig,
} from './core';

/**
 * Types of events that can be sent from client to server
 */
export enum ClientEventType {
  /** Update session configuration */
  SESSION_UPDATE = 'session.update',
  /** Append audio data to input buffer */
  INPUT_AUDIO_BUFFER_APPEND = 'input_audio_buffer.append',
  /** Commit input audio buffer for processing */
  INPUT_AUDIO_BUFFER_COMMIT = 'input_audio_buffer.commit',
  /** Clear input audio buffer */
  INPUT_AUDIO_BUFFER_CLEAR = 'input_audio_buffer.clear',
  /** Create a new conversation item */
  CONVERSATION_ITEM_CREATE = 'conversation.item.create',
  /** Retrieve a conversation item */
  CONVERSATION_ITEM_RETRIEVE = 'conversation.item.retrieve',
  /** Truncate a conversation item */
  CONVERSATION_ITEM_TRUNCATE = 'conversation.item.truncate',
  /** Delete a conversation item */
  CONVERSATION_ITEM_DELETE = 'conversation.item.delete',
  /** Create a new response */
  RESPONSE_CREATE = 'response.create',
  /** Cancel an in-progress response */
  RESPONSE_CANCEL = 'response.cancel',
  /** Update transcription session configuration */
  TRANSCRIPTION_SESSION_UPDATE = 'transcription_session.update',
  /** Clear output audio buffer */
  OUTPUT_AUDIO_BUFFER_CLEAR = 'output_audio_buffer.clear',
}

/**
 * Event to update session configuration
 */
export interface SessionUpdateEvent {
  /** Optional event ID for tracking */
  event_id?: EventId;
  type: ClientEventType.SESSION_UPDATE;
  session: SessionConfig;
}

/**
 * Event to append audio data to input buffer
 */
export interface InputAudioBufferAppendEvent {
  /** Optional event ID for tracking */
  event_id?: EventId;
  type: ClientEventType.INPUT_AUDIO_BUFFER_APPEND;
  /** Base64-encoded audio bytes in the format specified by input_audio_format */
  audio: string;
}

/**
 * Event to commit input audio buffer for processing
 */
export interface InputAudioBufferCommitEvent {
  /** Optional event ID for tracking */
  event_id?: EventId;
  type: ClientEventType.INPUT_AUDIO_BUFFER_COMMIT;
}

/**
 * Event to clear input audio buffer
 */
export interface InputAudioBufferClearEvent {
  /** Optional event ID for tracking */
  event_id?: EventId;
  type: ClientEventType.INPUT_AUDIO_BUFFER_CLEAR;
}

/**
 * Event to create a new conversation item
 */
export interface ConversationItemCreateEvent {
  /** Optional event ID for tracking */
  event_id?: EventId;
  type: ClientEventType.CONVERSATION_ITEM_CREATE;
  /** ID of the previous item in the conversation. If undefined, appends to the end */
  previous_item_id?: string;
  item: Item;
}

/**
 * Event to retrieve a conversation item
 */
export interface ConversationItemRetrieveEvent {
  /** Optional event ID for tracking */
  event_id?: EventId;
  type: ClientEventType.CONVERSATION_ITEM_RETRIEVE;
  item_id: string;
}

/**
 * Event to truncate a conversation item
 */
export interface ConversationItemTruncateEvent {
  /** Optional event ID for tracking */
  event_id?: EventId;
  type: ClientEventType.CONVERSATION_ITEM_TRUNCATE;
  item_id: string;
  /** Index of the content to truncate, must be 0 */
  content_index: number;
  /** Inclusive duration in milliseconds */
  audio_end_ms: number;
}

/**
 * Event to delete a conversation item
 */
export interface ConversationItemDeleteEvent {
  /** Optional event ID for tracking */
  event_id?: EventId;
  type: ClientEventType.CONVERSATION_ITEM_DELETE;
  item_id: string;
}

/**
 * Event to create a new response
 */
export interface ResponseCreateEvent {
  /** Optional event ID for tracking */
  event_id?: EventId;
  type: ClientEventType.RESPONSE_CREATE;
  response: ResponseConfig;
}

/**
 * Event to cancel an in-progress response
 */
export interface ResponseCancelEvent {
  /** Optional event ID for tracking */
  event_id?: EventId;
  type: ClientEventType.RESPONSE_CANCEL;
  /** Optional response ID. If not provided, cancels in-progress response in default conversation */
  response_id?: string;
}

/**
 * Event to update transcription session configuration
 */
export interface TranscriptionSessionUpdateEvent {
  /** Optional event ID for tracking */
  event_id?: EventId;
  type: ClientEventType.TRANSCRIPTION_SESSION_UPDATE;
  session: TranscriptionSessionConfig;
}

/**
 * Event to clear output audio buffer
 */
export interface OutputAudioBufferClearEvent {
  /** Optional event ID for tracking */
  event_id?: EventId;
  type: ClientEventType.OUTPUT_AUDIO_BUFFER_CLEAR;
}

/**
 * Union type for all client events
 */
export type ClientEvent =
  | SessionUpdateEvent
  | InputAudioBufferAppendEvent
  | InputAudioBufferCommitEvent
  | InputAudioBufferClearEvent
  | ConversationItemCreateEvent
  | ConversationItemRetrieveEvent
  | ConversationItemTruncateEvent
  | ConversationItemDeleteEvent
  | ResponseCreateEvent
  | ResponseCancelEvent
  | TranscriptionSessionUpdateEvent
  | OutputAudioBufferClearEvent;
