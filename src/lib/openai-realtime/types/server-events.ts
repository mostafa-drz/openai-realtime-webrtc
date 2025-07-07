/**
 * OpenAI Realtime API Server Event Types
 * @packageDocumentation
 */

import {
  EventId,
  Item,
  SessionResponse,
  Conversation,
  LogProbability,
  ErrorDetails,
  Response,
  ResponseContentPart,
  BaseResponseEvent,
  BaseDeltaEvent,
  TranscriptionSessionResponse,
  RateLimit,
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
  /** Input audio buffer speech started */
  INPUT_AUDIO_BUFFER_SPEECH_STARTED = 'input_audio_buffer.speech_started',
  /** Input audio buffer speech stopped */
  INPUT_AUDIO_BUFFER_SPEECH_STOPPED = 'input_audio_buffer.speech_stopped',
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
  /** A new output item has been added to the response */
  RESPONSE_OUTPUT_ITEM_ADDED = 'response.output_item.added',
  /** An output item has completed streaming */
  RESPONSE_OUTPUT_ITEM_DONE = 'response.output_item.done',
  /** A new content part has been added to an assistant message */
  RESPONSE_CONTENT_PART_ADDED = 'response.content_part.added',
  /** A content part has completed streaming */
  RESPONSE_CONTENT_PART_DONE = 'response.content_part.done',
  /** Transcription session configuration has been updated */
  TRANSCRIPTION_SESSION_UPDATED = 'transcription_session.updated',
  /** WebRTC Only: Output audio buffer has started streaming */
  OUTPUT_AUDIO_BUFFER_STARTED = 'output_audio_buffer.started',
  /** WebRTC Only: Output audio buffer has stopped streaming */
  OUTPUT_AUDIO_BUFFER_STOPPED = 'output_audio_buffer.stopped',
  /** WebRTC Only: Output audio buffer has been cleared */
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
  /** Text content delta update */
  RESPONSE_TEXT_DELTA = 'response.text.delta',
  /** Text content streaming complete */
  RESPONSE_TEXT_DONE = 'response.text.done',
  /** Audio transcript delta update */
  RESPONSE_AUDIO_TRANSCRIPT_DELTA = 'response.audio_transcript.delta',
  /** Audio transcript streaming complete */
  RESPONSE_AUDIO_TRANSCRIPT_DONE = 'response.audio_transcript.done',
  /** Audio content delta update */
  RESPONSE_AUDIO_DELTA = 'response.audio.delta',
  /** Audio content streaming complete */
  RESPONSE_AUDIO_DONE = 'response.audio.done',
  /** Function call arguments delta update */
  RESPONSE_FUNCTION_CALL_ARGUMENTS_DELTA = 'response.function_call_arguments.delta',
  /** Function call arguments streaming complete */
  RESPONSE_FUNCTION_CALL_ARGUMENTS_DONE = 'response.function_call_arguments.done',
  /** Rate limits have been updated */
  RATE_LIMITS_UPDATED = 'rate_limits.updated',
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
  session: SessionResponse | TranscriptionSessionResponse;
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
  /** A new Realtime transcription session configuration */
  session: TranscriptionSessionResponse;
}

/**
 * Event indicating input audio buffer has been committed
 * This event is sent when the buffer is committed either by the client or automatically in server VAD mode.
 * A conversation.item.created event will follow with the user message item.
 */
export interface InputAudioBufferCommittedEvent {
  /** Optional event ID for tracking */
  event_id: EventId;
  type: ServerEventType.INPUT_AUDIO_BUFFER_COMMITTED;
  /** ID of the user message item that will be created */
  item_id: string;
  /** ID of the preceding item after which the new item will be inserted */
  previous_item_id: string;
}

/**
 * Event indicating input audio buffer has been cleared
 * This event is sent when the client clears the buffer with input_audio_buffer.clear
 */
export interface InputAudioBufferClearedEvent {
  /** Optional event ID for tracking */
  event_id: EventId;
  type: ServerEventType.INPUT_AUDIO_BUFFER_CLEARED;
}

/**
 * Event indicating speech has been detected in the audio buffer
 * This event is sent in server_vad mode when speech is detected.
 * The client may want to use this to interrupt audio playback or provide visual feedback.
 * A input_audio_buffer.speech_stopped event will follow when speech stops.
 */
export interface InputAudioBufferSpeechStartedEvent {
  /** Optional event ID for tracking */
  event_id: EventId;
  type: ServerEventType.INPUT_AUDIO_BUFFER_SPEECH_STARTED;
  /** ID of the user message item that will be created when speech stops */
  item_id: string;
  /** Milliseconds from the start of all audio when speech was first detected */
  audio_start_ms: number;
}

/**
 * Event indicating speech has stopped in the audio buffer
 * This event is sent in server_vad mode when speech ends.
 * A conversation.item.created event will follow with the user message item.
 */
export interface InputAudioBufferSpeechStoppedEvent {
  /** Optional event ID for tracking */
  event_id: EventId;
  type: ServerEventType.INPUT_AUDIO_BUFFER_SPEECH_STOPPED;
  /** ID of the user message item that will be created */
  item_id: string;
  /** Milliseconds since the session started when speech stopped */
  audio_end_ms: number;
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
 * This is the first event of response creation, where the response is in an initial state of in_progress
 */
export interface ResponseCreatedEvent {
  /** Optional event ID for tracking */
  event_id: EventId;
  type: ServerEventType.RESPONSE_CREATED;
  /** The response resource */
  response: Response;
}

/**
 * Event indicating a response has completed streaming
 * This event is always emitted, regardless of the final state.
 * The response object includes all output items but omits raw audio data.
 */
export interface ResponseDoneEvent {
  /** Optional event ID for tracking */
  event_id: EventId;
  type: ServerEventType.RESPONSE_DONE;
  /** The response resource with complete output items but no raw audio data */
  response: Response;
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
export interface ConversationItemInputAudioTranscriptionDeltaEvent
  extends BaseDeltaEvent {
  type: ServerEventType.CONVERSATION_ITEM_INPUT_AUDIO_TRANSCRIPTION_DELTA;
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
  error: ErrorDetails;
}

/**
 * Event indicating a new output item has been added to the response
 */
export interface ResponseOutputItemAddedEvent extends BaseResponseEvent {
  type: ServerEventType.RESPONSE_OUTPUT_ITEM_ADDED;
  /** The item to add to the conversation */
  item: Item;
}

/**
 * Event indicating an output item has completed streaming
 */
export interface ResponseOutputItemDoneEvent extends BaseResponseEvent {
  type: ServerEventType.RESPONSE_OUTPUT_ITEM_DONE;
  /** The item to add to the conversation */
  item: Item;
}

/**
 * Event indicating a new content part has been added to an assistant message
 */
export interface ResponseContentPartAddedEvent extends BaseResponseEvent {
  type: ServerEventType.RESPONSE_CONTENT_PART_ADDED;
  /** The content part that was added */
  part: ResponseContentPart;
}

/**
 * Event indicating a content part has completed streaming
 */
export interface ResponseContentPartDoneEvent extends BaseResponseEvent {
  type: ServerEventType.RESPONSE_CONTENT_PART_DONE;
  /** The content part that is done */
  part: ResponseContentPart;
}

/**
 * Event indicating a text content delta update
 */
export interface ResponseTextDeltaEvent extends BaseDeltaEvent {
  type: ServerEventType.RESPONSE_TEXT_DELTA;
}

/**
 * Event indicating text content streaming is complete
 */
export interface ResponseTextDoneEvent extends BaseResponseEvent {
  type: ServerEventType.RESPONSE_TEXT_DONE;
  /** The final text content */
  text: string;
}

/**
 * Event indicating an audio transcript delta update
 */
export interface ResponseAudioTranscriptDeltaEvent extends BaseDeltaEvent {
  type: ServerEventType.RESPONSE_AUDIO_TRANSCRIPT_DELTA;
}

/**
 * Event indicating audio transcript streaming is complete
 */
export interface ResponseAudioTranscriptDoneEvent extends BaseResponseEvent {
  type: ServerEventType.RESPONSE_AUDIO_TRANSCRIPT_DONE;
  /** The final transcript of the audio */
  transcript: string;
}

/**
 * Event indicating an audio content delta update
 */
export interface ResponseAudioDeltaEvent extends BaseDeltaEvent {
  type: ServerEventType.RESPONSE_AUDIO_DELTA;
}

/**
 * Event indicating audio content streaming is complete
 */
export interface ResponseAudioDoneEvent extends BaseResponseEvent {
  type: ServerEventType.RESPONSE_AUDIO_DONE;
}

/**
 * Event indicating function call arguments delta update
 */
export interface ResponseFunctionCallArgumentsDeltaEvent
  extends BaseDeltaEvent {
  type: ServerEventType.RESPONSE_FUNCTION_CALL_ARGUMENTS_DELTA;
  /** The ID of the function call */
  call_id: string;
}

/**
 * Event indicating function call arguments streaming is complete
 */
export interface ResponseFunctionCallArgumentsDoneEvent
  extends BaseResponseEvent {
  type: ServerEventType.RESPONSE_FUNCTION_CALL_ARGUMENTS_DONE;
  /** The ID of the function call */
  call_id: string;
  /** The final arguments as a JSON string */
  arguments: string;
}

/**
 * Event indicating rate limits have been updated
 * Emitted at the beginning of a Response to indicate the updated rate limits.
 * When a Response is created some tokens will be "reserved" for the output tokens,
 * the rate limits shown here reflect that reservation, which is then adjusted
 * accordingly once the Response is completed.
 */
export interface RateLimitsUpdatedEvent {
  /** Optional event ID for tracking */
  event_id: EventId;
  type: ServerEventType.RATE_LIMITS_UPDATED;
  /** List of rate limit information */
  rate_limits: RateLimit[];
}

/**
 * Base interface for WebRTC-specific events
 */
export interface BaseWebRTCEvent {
  /** Optional event ID for tracking */
  event_id: EventId;
  /** The unique ID of the response that produced the audio */
  response_id: string;
}

/**
 * Event indicating output audio buffer has started streaming
 * WebRTC Only: Emitted when the server begins streaming audio to the client.
 * This event is emitted after an audio content part has been added
 * (response.content_part.added) to the response.
 *
 * Note: This event is only available when using WebRTC for audio streaming.
 * When using other audio streaming methods, this event will not be emitted.
 */
export interface OutputAudioBufferStartedEvent extends BaseWebRTCEvent {
  type: ServerEventType.OUTPUT_AUDIO_BUFFER_STARTED;
}

/**
 * Event indicating output audio buffer has stopped streaming
 * WebRTC Only: Emitted when the output audio buffer has been completely drained
 * on the server, and no more audio is forthcoming. This event is emitted after
 * the full response data has been sent to the client (response.done).
 *
 * Note: This event is only available when using WebRTC for audio streaming.
 * When using other audio streaming methods, this event will not be emitted.
 */
export interface OutputAudioBufferStoppedEvent extends BaseWebRTCEvent {
  type: ServerEventType.OUTPUT_AUDIO_BUFFER_STOPPED;
}

/**
 * Event indicating output audio buffer has been cleared
 * WebRTC Only: Emitted when the output audio buffer is cleared. This happens
 * either in VAD mode when the user has interrupted
 * (input_audio_buffer.speech_started), or when the client has emitted the
 * output_audio_buffer.clear event to manually cut off the current audio response.
 *
 * Note: This event is only available when using WebRTC for audio streaming.
 * When using other audio streaming methods, this event will not be emitted.
 */
export interface OutputAudioBufferClearedEvent extends BaseWebRTCEvent {
  type: ServerEventType.OUTPUT_AUDIO_BUFFER_CLEARED;
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
  | InputAudioBufferSpeechStartedEvent
  | InputAudioBufferSpeechStoppedEvent
  | ConversationItemCreatedEvent
  | ConversationItemRetrievedEvent
  | ConversationItemTruncatedEvent
  | ConversationItemDeletedEvent
  | ResponseCreatedEvent
  | ResponseDoneEvent
  | ResponseCancelledEvent
  | ResponseOutputItemAddedEvent
  | ResponseOutputItemDoneEvent
  | ResponseContentPartAddedEvent
  | ResponseContentPartDoneEvent
  | ResponseTextDeltaEvent
  | ResponseTextDoneEvent
  | ResponseAudioTranscriptDeltaEvent
  | ResponseAudioTranscriptDoneEvent
  | ResponseAudioDeltaEvent
  | ResponseAudioDoneEvent
  | ResponseFunctionCallArgumentsDeltaEvent
  | ResponseFunctionCallArgumentsDoneEvent
  | OutputAudioBufferStartedEvent
  | OutputAudioBufferStoppedEvent
  | OutputAudioBufferClearedEvent
  | ConversationCreatedEvent
  | ConversationItemInputAudioTranscriptionCompletedEvent
  | ConversationItemInputAudioTranscriptionDeltaEvent
  | ConversationItemInputAudioTranscriptionFailedEvent
  | RateLimitsUpdatedEvent
  | ErrorEvent;
