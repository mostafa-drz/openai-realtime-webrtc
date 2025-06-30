/**
 * OpenAI Realtime API Client Event Types
 * @packageDocumentation
 */

import {
  SessionConfig,
  Item,
  ResponseConfig,
  TranscriptionSessionConfig,
  BaseClientEvent,
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
export interface SessionUpdateEvent extends BaseClientEvent {
  type: ClientEventType.SESSION_UPDATE;
  session: SessionConfig;
}

/**
 * Event to append audio data to input buffer
 */
export interface InputAudioBufferAppendEvent extends BaseClientEvent {
  type: ClientEventType.INPUT_AUDIO_BUFFER_APPEND;
  /** Base64-encoded audio bytes in the format specified by input_audio_format */
  audio: string;
}

/**
 * Event to commit input audio buffer for processing
 */
export interface InputAudioBufferCommitEvent extends BaseClientEvent {
  type: ClientEventType.INPUT_AUDIO_BUFFER_COMMIT;
}

/**
 * Event to clear input audio buffer
 */
export interface InputAudioBufferClearEvent extends BaseClientEvent {
  type: ClientEventType.INPUT_AUDIO_BUFFER_CLEAR;
}

/**
 * Event to create a new conversation item
 */
export interface ConversationItemCreateEvent extends BaseClientEvent {
  type: ClientEventType.CONVERSATION_ITEM_CREATE;
  /** ID of the previous item in the conversation. If undefined, appends to the end */
  previous_item_id?: string;
  item: Item;
}

/**
 * Event to retrieve a conversation item
 */
export interface ConversationItemRetrieveEvent extends BaseClientEvent {
  type: ClientEventType.CONVERSATION_ITEM_RETRIEVE;
  item_id: string;
}

/**
 * Event to truncate a conversation item
 */
export interface ConversationItemTruncateEvent extends BaseClientEvent {
  type: ClientEventType.CONVERSATION_ITEM_TRUNCATE;
  /** ID of the item to truncate */
  item_id: string;
  /** Content index, typically set to 0 */
  content_index: number;
  /** Inclusive duration in milliseconds */
  audio_end_ms: number;
}

/**
 * Event to delete a conversation item
 */
export interface ConversationItemDeleteEvent extends BaseClientEvent {
  type: ClientEventType.CONVERSATION_ITEM_DELETE;
  /** ID of the item to delete */
  item_id: string;
}

/**
 * Event to create a new response
 */
export interface ResponseCreateEvent extends BaseClientEvent {
  type: ClientEventType.RESPONSE_CREATE;
  response: ResponseConfig;
}

/**
 * Event to cancel an in-progress response
 * This event can be used to stop the current response generation
 * and clear any pending output.
 */
export interface ResponseCancelEvent extends BaseClientEvent {
  type: ClientEventType.RESPONSE_CANCEL;
  /** Optional response ID. If not provided, cancels in-progress response in default conversation */
  response_id?: string;
  /** Optional reason for cancellation */
  reason?: string;
  /** Optional metadata about the cancellation */
  metadata?: Record<string, string>;
}

/**
 * Event to update transcription session configuration
 */
export interface TranscriptionSessionUpdateEvent extends BaseClientEvent {
  type: ClientEventType.TRANSCRIPTION_SESSION_UPDATE;
  session: TranscriptionSessionConfig;
}

/**
 * Event to clear output audio buffer
 */
export interface OutputAudioBufferClearEvent extends BaseClientEvent {
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
