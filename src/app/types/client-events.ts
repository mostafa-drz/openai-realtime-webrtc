/**
 * OpenAI Realtime API Client Event Types
 * @packageDocumentation
 */

import {
  EventId,
  SessionConfig,
  Item,
  Tool,
  ToolChoice,
  Modality,
  Voice,
  AudioFormat,
  Temperature,
  MaxTokens,
} from './core';

export enum ClientEventType {
  SESSION_UPDATE = 'session.update',
  INPUT_AUDIO_BUFFER_APPEND = 'input_audio_buffer.append',
  INPUT_AUDIO_BUFFER_COMMIT = 'input_audio_buffer.commit',
  INPUT_AUDIO_BUFFER_CLEAR = 'input_audio_buffer.clear',
  CONVERSATION_ITEM_CREATE = 'conversation.item.create',
  CONVERSATION_ITEM_RETRIEVE = 'conversation.item.retrieve',
  CONVERSATION_ITEM_TRUNCATE = 'conversation.item.truncate',
  CONVERSATION_ITEM_DELETE = 'conversation.item.delete',
  RESPONSE_CREATE = 'response.create',
  RESPONSE_CANCEL = 'response.cancel',
}

// Event Interfaces
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

export interface ConversationItemCreateEvent {
  event_id?: EventId;
  type: ClientEventType.CONVERSATION_ITEM_CREATE;
  previous_item_id?: string | null; // null for append, 'root' for beginning, or specific ID for insertion
  item: Item;
}

export interface ConversationItemRetrieveEvent {
  event_id?: EventId;
  type: ClientEventType.CONVERSATION_ITEM_RETRIEVE;
  item_id: string;
}

export interface ConversationItemTruncateEvent {
  event_id?: EventId;
  type: ClientEventType.CONVERSATION_ITEM_TRUNCATE;
  item_id: string;
  content_index: number; // Set to 0
  audio_end_ms: number; // Inclusive duration in milliseconds
}

export interface ConversationItemDeleteEvent {
  event_id?: EventId;
  type: ClientEventType.CONVERSATION_ITEM_DELETE;
  item_id: string;
}

export interface ResponseCreateEvent {
  event_id?: EventId;
  type: ClientEventType.RESPONSE_CREATE;
  response: {
    conversation?: 'auto' | 'none'; // Default: 'auto'
    input?: Item[]; // Creates new context instead of using default conversation
    instructions?: string; // Override session instructions
    max_response_output_tokens?: MaxTokens;
    metadata?: Record<string, string>; // Max 16 key-value pairs, key max 64 chars, value max 512 chars
    modalities?: Modality[];
    output_audio_format?: AudioFormat;
    temperature?: Temperature;
    tool_choice?: ToolChoice | { type: 'function'; function: { name: string } };
    tools?: Tool[];
    voice?: Voice;
  };
}

export interface ResponseCancelEvent {
  event_id?: EventId;
  type: ClientEventType.RESPONSE_CANCEL;
  response_id?: string; // Optional - if not provided, cancels in-progress response in default conversation
}

// Union type for all client events
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
  | ResponseCancelEvent;
