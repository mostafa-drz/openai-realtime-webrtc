/**
 * OpenAI Realtime API Server Event Types
 * @packageDocumentation
 */

import {
  EventId,
  Item,
  TranscriptionSessionConfig,
  SessionResponse,
  Conversation,
  LogProbability,
  TranscriptionError,
} from './core';

/**
 * Types of events that can be sent from server to client
 */
export enum ServerEventType {
  /** Session has been created */
  SESSION_CREATED = 'session.created',
  /** Session configuration has been updated */
  SESSION_UPDATED = 'session.updated',
  /** Input audio buffer has been committed */
  INPUT_AUDIO_BUFFER_COMMITTED = 'input_audio_buffer.committed',
  /** Input audio buffer has been cleared */
  INPUT_AUDIO_BUFFER_CLEARED = 'input_audio_buffer.cleared',
  /** A new conversation item has been created */
  CONVERSATION_ITEM_CREATED = 'conversation.item.created',
  /** A conversation item has been retrieved */
  CONVERSATION_ITEM_RETRIEVED = 'conversation.item.retrieved',
  /** A conversation item has been truncated */
  CONVERSATION_ITEM_TRUNCATED = 'conversation.item.truncated',
  /** A conversation item has been deleted */
  CONVERSATION_ITEM_DELETED = 'conversation.item.deleted',
  /** A new response has been created */
  RESPONSE_CREATED = 'response.created',
  /** A response has completed */
  RESPONSE_DONE = 'response.done',
  /** A response has been cancelled */
  RESPONSE_CANCELLED = 'response.cancelled',
  /** Transcription session configuration has been updated */
  TRANSCRIPTION_SESSION_UPDATED = 'transcription_session.updated',
  /** Output audio buffer has been cleared */
  OUTPUT_AUDIO_BUFFER_CLEARED = 'output_audio_buffer.cleared',
  /** An error has occurred */
  ERROR = 'error',
  /** A new conversation has been created */
  CONVERSATION_CREATED = 'conversation.created',
  /** Audio transcription has completed */
  CONVERSATION_ITEM_INPUT_AUDIO_TRANSCRIPTION_COMPLETED = 'conversation.item.input_audio_transcription.completed',
  /** Audio transcription delta */
  CONVERSATION_ITEM_INPUT_AUDIO_TRANSCRIPTION_DELTA = 'conversation.item.input_audio_transcription.delta',
  /** Audio transcription failed */
  CONVERSATION_ITEM_INPUT_AUDIO_TRANSCRIPTION_FAILED = 'conversation.item.input_audio_transcription.failed',
}

/**
 * Types of errors that can occur
 */
export enum ErrorType {
  /** Invalid request error */
  INVALID_REQUEST_ERROR = 'invalid_request_error',
  /** Server error */
  SERVER_ERROR = 'server_error',
}

/**
 * Details about an error that occurred
 */
export interface ErrorDetails {
  /** Type of error */
  type: ErrorType;
  /** Error code if applicable */
  code?: string | null;
  /** Error message */
  message: string;
  /** Parameter that caused the error if applicable */
  param?: string | null;
  /** ID of the client event that caused the error if applicable */
  event_id?: string | null;
}

/**
 * Event indicating an error has occurred
 */
export interface ErrorEvent {
  /** Optional event ID for tracking */
  event_id: EventId;
  type: ServerEventType.ERROR;
  error: ErrorDetails;
}

/**
 * Event indicating a session has been created
 */
export interface SessionCreatedEvent {
  /** Optional event ID for tracking */
  event_id: EventId;
  type: ServerEventType.SESSION_CREATED;
  session: SessionResponse;
}

/**
 * Event indicating session configuration has been updated
 */
export interface SessionUpdatedEvent {
  /** Optional event ID for tracking */
  event_id: EventId;
  type: ServerEventType.SESSION_UPDATED;
  session: SessionResponse;
}

/**
 * Event indicating transcription session configuration has been updated
 */
export interface TranscriptionSessionUpdatedEvent {
  /** Optional event ID for tracking */
  event_id: EventId;
  type: ServerEventType.TRANSCRIPTION_SESSION_UPDATED;
  session: TranscriptionSessionConfig;
}

/**
 * Event indicating input audio buffer has been committed
 */
export interface InputAudioBufferCommittedEvent {
  /** Optional event ID for tracking */
  event_id: EventId;
  type: ServerEventType.INPUT_AUDIO_BUFFER_COMMITTED;
}

/**
 * Event indicating input audio buffer has been cleared
 */
export interface InputAudioBufferClearedEvent {
  /** Optional event ID for tracking */
  event_id: EventId;
  type: ServerEventType.INPUT_AUDIO_BUFFER_CLEARED;
}

/**
 * Event indicating a new conversation item has been created
 */
export interface ConversationItemCreatedEvent {
  /** Optional event ID for tracking */
  event_id: EventId;
  type: ServerEventType.CONVERSATION_ITEM_CREATED;
  /** ID of the previous item in the conversation */
  previous_item_id?: string;
  item: Item;
}

/**
 * Event indicating a conversation item has been retrieved
 */
export interface ConversationItemRetrievedEvent {
  /** Optional event ID for tracking */
  event_id: EventId;
  type: ServerEventType.CONVERSATION_ITEM_RETRIEVED;
  /** ID of the previous item in the conversation */
  previous_item_id?: string;
  item: Item;
}

/**
 * Event indicating a conversation item has been truncated
 */
export interface ConversationItemTruncatedEvent {
  /** Optional event ID for tracking */
  event_id: EventId;
  type: ServerEventType.CONVERSATION_ITEM_TRUNCATED;
  item: Item;
}

/**
 * Event indicating a conversation item has been deleted
 */
export interface ConversationItemDeletedEvent {
  /** Optional event ID for tracking */
  event_id: EventId;
  type: ServerEventType.CONVERSATION_ITEM_DELETED;
  item_id: string;
}

/**
 * Event indicating a new response has been created
 */
export interface ResponseCreatedEvent {
  /** Optional event ID for tracking */
  event_id: EventId;
  type: ServerEventType.RESPONSE_CREATED;
  response_id: string;
}

/**
 * Event indicating a response has completed
 */
export interface ResponseDoneEvent {
  /** Optional event ID for tracking */
  event_id: EventId;
  type: ServerEventType.RESPONSE_DONE;
  response_id: string;
}

/**
 * Event indicating a response has been cancelled
 */
export interface ResponseCancelledEvent {
  /** Optional event ID for tracking */
  event_id: EventId;
  type: ServerEventType.RESPONSE_CANCELLED;
  response_id: string;
}

/**
 * Event indicating output audio buffer has been cleared
 */
export interface OutputAudioBufferClearedEvent {
  /** Optional event ID for tracking */
  event_id: EventId;
  type: ServerEventType.OUTPUT_AUDIO_BUFFER_CLEARED;
}

/**
 * Event indicating a new conversation has been created
 */
export interface ConversationCreatedEvent {
  /** Optional event ID for tracking */
  event_id: EventId;
  type: ServerEventType.CONVERSATION_CREATED;
  conversation: Conversation;
}

/**
 * Event indicating audio transcription has completed
 */
export interface ConversationItemInputAudioTranscriptionCompletedEvent {
  /** Optional event ID for tracking */
  event_id: EventId;
  type: ServerEventType.CONVERSATION_ITEM_INPUT_AUDIO_TRANSCRIPTION_COMPLETED;
  /** ID of the user message item containing the audio */
  item_id: string;
  /** Index of the content part containing the audio */
  content_index: number;
  /** The transcribed text */
  transcript: string;
  /** The log probabilities of the transcription */
  logprobs: LogProbability[] | null;
}

/**
 * Event indicating a delta update to audio transcription
 */
export interface ConversationItemInputAudioTranscriptionDeltaEvent {
  /** Optional event ID for tracking */
  event_id: EventId;
  type: ServerEventType.CONVERSATION_ITEM_INPUT_AUDIO_TRANSCRIPTION_DELTA;
  /** ID of the item */
  item_id: string;
  /** Index of the content part in the item's content array */
  content_index: number;
  /** The text delta */
  delta: string;
  /** The log probabilities of the transcription */
  logprobs: LogProbability[] | null;
}

/**
 * Event indicating audio transcription has failed
 */
export interface ConversationItemInputAudioTranscriptionFailedEvent {
  /** Optional event ID for tracking */
  event_id: EventId;
  type: ServerEventType.CONVERSATION_ITEM_INPUT_AUDIO_TRANSCRIPTION_FAILED;
  /** ID of the user message item */
  item_id: string;
  /** Index of the content part containing the audio */
  content_index: number;
  /** Details of the transcription error */
  error: TranscriptionError;
}

/**
 * Union type for all server events
 */
export type ServerEvent =
  | SessionCreatedEvent
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
  | ConversationCreatedEvent
  | ConversationItemInputAudioTranscriptionCompletedEvent
  | ConversationItemInputAudioTranscriptionDeltaEvent
  | ConversationItemInputAudioTranscriptionFailedEvent
  | ErrorEvent;
