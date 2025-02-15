/**
 * Enum representing the type of a conversation item.
 */
export enum ConversationItemType {
  MESSAGE = 'message',
  FUNCTION_CALL = 'function_call',
  FUNCTION_CALL_OUTPUT = 'function_call_output',
}

/**
 * Types of content in a message
 */
export enum ContentType {
  INPUT_TEXT = 'input_text',
  INPUT_AUDIO = 'input_audio',
  ITEM_REFERENCE = 'item_reference',
  TEXT = 'text',
}

/**
 * Enum representing the type of transcript.
 */
export enum TranscriptType {
  INPUT = 'input',
  OUTPUT = 'output',
}

/**
 * Enum representing the role of a transcript.
 */
export enum ConversationRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

/**
 * Status of a conversation item
 */
export enum ConversationItemStatus {
  COMPLETED = 'completed',
  INCOMPLETE = 'incomplete',
}

// Individual content item
export interface ConversationContent {
  /**
   * The type of the content (e.g., input_text, input_audio, etc.).
   */
  type: ContentType;

  /**
   * The text content, used for input_text and text content types.
   */
  text?: string;

  /**
   * ID of a previous conversation item to reference (for item_reference content types).
   */
  id?: string;

  /**
   * Base64-encoded audio bytes, used for input_audio content type.
   */
  audio?: string;

  /**
   * The transcript of the audio, used for input_audio content type.
   */
  transcript?: string;
}

// Function call details for function_call and function_call_output items
export interface FunctionCallDetails {
  /**
   * The ID of the function call.
   */
  call_id: string;

  /**
   * The name of the function being called.
   */
  name?: string;

  /**
   * The arguments of the function call.
   */
  arguments?: string;

  /**
   * The output of the function call.
   */
  output?: string;
}

// Conversation item structure
export interface ConversationItem extends FunctionCallDetails {
  /**
   * Unique ID of the item. If not provided, the server will generate one.
   */
  id?: string;

  /**
   * The type of the item (message, function_call, function_call_output).
   */
  type: ConversationItemType;

  /**
   * Identifier for the API object being returned, always "realtime.item".
   */
  object: 'realtime.item';

  /**
   * Status of the item (completed, incomplete).
   */
  status?: ConversationItemStatus;

  /**
   * The role of the sender (user, assistant, system). Only applicable for message items.
   */
  role?: ConversationRole;

  /**
   * Content of the message. Applicable only for message items.
   */
  content?: ConversationContent[];
}

/**
 * Enum representing all possible event types for the OpenAI Realtime API.
 */
export enum RealtimeEventType {
  // Session events
  SESSION_CREATED = 'session.created',
  SESSION_UPDATED = 'session.updated',
  SESSION_UPDATE = 'session.update',

  // Input audio buffer events
  INPUT_AUDIO_SPEECH_STARTED = 'input_audio_buffer.speech_started',
  INPUT_AUDIO_SPEECH_STOPPED = 'input_audio_buffer.speech_stopped',
  INPUT_AUDIO_COMMITTED = 'input_audio_buffer.committed',
  INPUT_AUDIO_CLEARED = 'input_audio_buffer.cleared',

  // Conversation events
  CONVERSATION_ITEM_CREATED = 'conversation.item.created',
  CONVERSATION_ITEM_INPUT_AUDIO_TRANSCRIPTION_COMPLETED = 'conversation.item.input_audio_transcription.completed',
  CONVERSATION_ITEM_DELETED = 'conversation.item.deleted',
  CONVERSATION_ITEM_CREATE = 'conversation.item.create',

  // Response events
  RESPONSE_CREATED = 'response.created',
  RESPONSE_CREATE = 'response.create',
  RESPONSE_OUTPUT_ITEM_ADDED = 'response.output_item.added',
  RESPONSE_AUDIO_TRANSCRIPT_DELTA = 'response.audio_transcript.delta',
  RESPONSE_AUDIO_TRANSCRIPT_DONE = 'response.audio_transcript.done',
  RESPONSE_CONTENT_PART_DONE = 'response.content_part.done',
  RESPONSE_DONE = 'response.done',
  RESPONSE_CANCELLED = 'response.cancelled',
  RESPONSE_OUTPUT_ITEM_DONE = 'response.output_item.done',

  // Output audio buffer events
  OUTPUT_AUDIO_STARTED = 'output_audio_buffer.audio_started',
  OUTPUT_AUDIO_STOPPED = 'output_audio_buffer.audio_stopped',

  // Rate limit updates
  RATE_LIMITS_UPDATED = 'rate_limits.updated',

  // Input audio buffer events
  INPUT_AUDIO_BUFFER_APPEND = 'input_audio_buffer.append', // Appends audio data to the buffer
  INPUT_AUDIO_BUFFER_COMMIT = 'input_audio_buffer.commit', // Commits the buffer for processing
  INPUT_AUDIO_BUFFER_CLEAR = 'input_audio_buffer.clear', // Clears the audio buffer

  // Error handling
  ERROR = 'error',
}

/**
 * Base interface for all OpenAI WebRTC events.
 */
interface BaseRealtimeEvent {
  /**
   * Type of the event (e.g., input transcription, response).
   */
  type: RealtimeEventType;

  /**
   * Unique identifier for the event.
   */
  event_id?: string;

  /**
   * Timestamp of the event (optional for debugging/logging purposes).
   */
  timestamp?: number;
}

/**
 * Event for input transcription completed.
 */
interface InputAudioTranscriptionCompletedEvent extends BaseRealtimeEvent {
  type: RealtimeEventType.CONVERSATION_ITEM_INPUT_AUDIO_TRANSCRIPTION_COMPLETED;
  item_id: string;
  content_index: number;
  transcript: string;
}

/**
 * Event for response audio transcript done.
 */
interface ResponseAudioTranscriptDoneEvent extends BaseRealtimeEvent {
  type: RealtimeEventType.RESPONSE_AUDIO_TRANSCRIPT_DONE;
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  transcript: string;
}

/**
 * Event for response creation.
 */
interface ResponseCreatedEvent extends BaseRealtimeEvent {
  type: RealtimeEventType.RESPONSE_CREATED;
  response: unknown; // Replace with a detailed type if you have it
}

/**
 * Event for appending audio data to the input buffer.
 */
export interface InputAudioBufferAppendEvent extends BaseRealtimeEvent {
  type: RealtimeEventType.INPUT_AUDIO_BUFFER_APPEND;
  audio: string; // Base64-encoded audio data
}

/**
 * Event for committing the input audio buffer for processing.
 */
export interface InputAudioBufferCommitEvent extends BaseRealtimeEvent {
  type: RealtimeEventType.INPUT_AUDIO_BUFFER_COMMIT;
}

/**
 * Event for clearing the input audio buffer.
 */
export interface InputAudioBufferClearEvent extends BaseRealtimeEvent {
  type: RealtimeEventType.INPUT_AUDIO_BUFFER_CLEAR;
}

/**
 * Event for creating a conversation item (e.g., sending a user message).
 */
export interface ConversationItemCreatedEvent extends BaseRealtimeEvent {
  type: RealtimeEventType.CONVERSATION_ITEM_CREATED;
  item: {
    type: 'message'; // Represents the type of conversation item
    role: ConversationRole.USER; // The role of the transcript, always USER for this event
    content: Array<{
      type: 'input_text'; // Specifies the type of input
      text: string; // The text content of the input message
    }>;
  };
}

/**
 * Error object to store details of session-level errors.
 * Developers can use this for error tracking and handling.
 */
export interface SessionError {
  /**
   * Unique identifier for the error event.
   */
  event_id: string;

  /**
   * Type of the error (e.g., "invalid_request_error", "server_error").
   */
  type: string;

  /**
   * Error code, if available.
   */
  code: string | null;

  /**
   * Human-readable error message.
   */
  message: string;

  /**
   * Parameter related to the error, if any.
   */
  param: string | null;

  /**
   * The client event ID that caused the error, if applicable.
   */
  related_event_id: string | null;

  /**
   * Timestamp when the error occurred, in milliseconds since Unix epoch.
   */
  timestamp: number;
}

/**
 * Interface for creating a new response in the OpenAI Realtime API.
 */
export interface ResponseCreateBody {
  modalities?: Modality[];
  instructions?: string;
  voice?: Voice;
  output_audio_format?: AudioFormat;
  tools?: Tool[];
  tool_choice?: ToolChoice;
  temperature?: number;
  max_response_output_tokens?: number | 'inf';
  conversation?: 'auto' | 'none';
  metadata?: Record<string, string>;
  input?: Array<{
    id?: string;
    type: 'message' | 'function_call' | 'function_call_output';
    object: 'realtime.item';
    status?: 'completed' | 'incomplete';
    role?: 'user' | 'assistant' | 'system';
    content?: Array<{
      type: 'input_text' | 'input_audio' | 'text';
      text?: string;
      audio?: string;
    }>;
    call_id?: string;
    name?: string;
    arguments?: string;
    output?: string;
  }>;
}

/**
 * Event for creating a response manually.
 */
export interface ResponseCreateEvent extends BaseRealtimeEvent {
  type: RealtimeEventType.RESPONSE_CREATE;
  response: ResponseCreateBody | object;
}

/**
 * Event for error handling.
 */
export interface ErrorEvent extends BaseRealtimeEvent {
  type: RealtimeEventType.ERROR;
  error: SessionError;
}

/**
 * Event for creating a conversation item (e.g., sending a user message).
 * Used to add a new item to the conversation context.
 */
export interface ConversationItemCreateEvent extends BaseRealtimeEvent {
  type: RealtimeEventType.CONVERSATION_ITEM_CREATE;

  /**
   * The ID of the preceding item after which the new item will be inserted.
   * - If not set, the new item will be appended to the end of the conversation.
   * - If set to "root", the new item will be added to the beginning of the conversation.
   * - If set to an existing ID, allows an item to be inserted mid-conversation.
   * - If the ID cannot be found, an error will be returned.
   */
  previous_item_id?: string | null;

  /**
   * The item to add to the conversation.
   */
  item: {
    id?: string;
    type: ConversationItemType;
    status?: ConversationItemStatus;
    role?: ConversationRole;
    content?: ConversationContent[];
    function_call_details?: FunctionCallDetails;
  };
}

/**
 * Event for when a response output item is done.
 */
export interface ResponseOutputItemDoneEvent extends BaseRealtimeEvent {
  type: RealtimeEventType.RESPONSE_OUTPUT_ITEM_DONE;

  /**
   * The ID of the response associated with this output item.
   */
  response_id: string;

  /**
   * The index of the output item in the response.
   */
  output_index: number;

  /**
   * Details of the completed output item.
   */
  item: {
    /**
     * Unique ID of the output item.
     */
    id: string;

    /**
     * Object type, always "realtime.item".
     */
    object: 'realtime.item';

    /**
     * The type of the item, such as "function_call", "message", etc.
     */
    type: ConversationItemType;

    /**
     * The status of the item, typically "completed".
     */
    status: ConversationItemStatus;

    /**
     * Role associated with the item, e.g., "assistant" or "user" (if applicable).
     */
    role?: ConversationRole;

    /**
     * The content of the message, applicable for message-type items.
     */
    content?: ConversationContent[];
  } & FunctionCallDetails;
}

/**
 * Event for response completion.
 * Triggered when the OpenAI Realtime API completes generating a response.
 */
export interface ResponseDoneEvent extends BaseRealtimeEvent {
  type: RealtimeEventType.RESPONSE_DONE;

  /**
   * The response object containing details about the generation.
   */
  response: {
    /**
     * The unique ID of the response.
     */
    id: string;

    /**
     * The object type, always "realtime.response".
     */
    object: 'realtime.response';

    /**
     * The final status of the response.
     * Possible values: 'completed', 'cancelled', 'failed', 'incomplete'.
     */
    status: 'completed' | 'cancelled' | 'failed' | 'incomplete';

    /**
     * Additional details about the status of the response.
     */
    status_details?: Record<string, unknown>;

    /**
     * List of output items generated by the response.
     */
    output: Array<{
      /**
       * Unique ID of the output item.
       */
      id: string;

      /**
       * Object type, always "realtime.item".
       */
      object: 'realtime.item';

      /**
       * The type of the item, e.g., 'message', 'function_call', etc.
       */
      type: ConversationItemType;

      /**
       * Status of the item, typically 'completed'.
       */
      status: ConversationItemStatus;

      /**
       * Role associated with the item, e.g., 'assistant'.
       */
      role?: ConversationRole;

      /**
       * The content of the message or other output details.
       */
      content?: ConversationContent[];
    }>;

    /**
     * Usage statistics for the response, including token counts.
     */
    usage?: {
      /**
       * Total tokens (input + output) used for the response.
       */
      total_tokens: number;

      /**
       * Number of input tokens used in the request.
       */
      input_tokens: number;

      /**
       * Number of output tokens generated by the response.
       */
      output_tokens: number;

      /**
       * Detailed breakdown of input tokens.
       */
      input_token_details?: {
        /**
         * Cached tokens reused from previous context.
         */
        cached_tokens: number;

        /**
         * Number of text tokens in the input.
         */
        text_tokens: number;

        /**
         * Number of audio tokens in the input.
         */
        audio_tokens: number;
      };

      /**
       * Detailed breakdown of output tokens.
       */
      output_token_details?: {
        /**
         * Number of text tokens in the output.
         */
        text_tokens: number;

        /**
         * Number of audio tokens in the output.
         */
        audio_tokens: number;
      };
    };

    /**
     * Metadata associated with the response, provided by the developer.
     */
    metadata?: Record<string, string>;

    /**
     * ID of the conversation the response is part of, if applicable.
     */
    conversation_id?: string;

    /**
     * Voice used for audio responses (e.g., 'alloy', 'echo').
     */
    voice?: Voice;

    /**
     * The modalities used in the response (e.g., 'text', 'audio').
     */
    modalities?: Modality[];

    /**
     * The format of the audio output (e.g., 'pcm16').
     */
    output_audio_format?: AudioFormat;

    /**
     * The temperature value used for response generation.
     */
    temperature?: number;

    /**
     * Maximum output tokens allowed for the response.
     */
    max_output_tokens?: number | 'inf';
  };
}

/**
 * Event for updating the session configuration.
 */
interface UpdateSessionConfigEvent extends BaseRealtimeEvent {
  type: RealtimeEventType.SESSION_UPDATE;
  session: Partial<RealtimeSession>;
}

/**
 * Union type for all OpenAI WebRTC events.
 */
export type RealtimeEvent =
  | InputAudioTranscriptionCompletedEvent
  | ResponseAudioTranscriptDoneEvent
  | ResponseCreatedEvent
  | InputAudioBufferAppendEvent
  | InputAudioBufferCommitEvent
  | InputAudioBufferClearEvent
  | ConversationItemCreatedEvent
  | ResponseCreateEvent
  | ErrorEvent
  | ConversationItemCreateEvent
  | ResponseOutputItemDoneEvent
  | ResponseDoneEvent
  | UpdateSessionConfigEvent;

/**
 * Interface representing a transcript in a session.
 */
export interface Transcript {
  /**
   * The textual content of the transcript.
   */
  content: string;

  /**
   * The timestamp when the transcript was created, in milliseconds since Unix epoch.
   */
  timestamp: number;

  /**
   * Indicates whether the transcript is an input from the user or an output from the model.
   */
  type: TranscriptType;

  /**
   * The role associated with the transcript, either "user" (input) or "model" (output).
   */
  role: ConversationRole;
}

/**
 * Enums for fixed string values used in the session configuration.
 */

// Supported AI voice options.
export enum Voice {
  ALLOY = 'alloy',
  ASH = 'ash',
  BALLAD = 'ballad',
  CORAL = 'coral',
  ECHO = 'echo',
  SAGE = 'sage',
  SHIMMER = 'shimmer',
  VERSE = 'verse',
}

/**
 * Supported input/output audio formats.
 */
export enum AudioFormat {
  PCM16 = 'pcm16',
  G711_ULAW = 'g711_ulaw',
  G711_ALAW = 'g711_alaw',
}

/**
 * Supported turn detection types.
 */
export enum TurnDetectionType {
  SERVER_VAD = 'server_vad',
}

/**
 * Supported tool choice options for the model.
 */
export enum ToolChoice {
  AUTO = 'auto',
  NONE = 'none',
  REQUIRED = 'required',
}

/**
 * Enum for modalities the model supports.
 */
export enum Modality {
  AUDIO = 'audio',
  TEXT = 'text',
}

/**
 * Configuration for input audio transcription.
 */
export interface AudioTranscriptionConfig {
  /**
   * The transcription model to use.
   * Currently, only `whisper-1` is supported.
   */
  model: 'whisper-1';
}

/**
 * Configuration for turn detection.
 */
export interface TurnDetectionConfig {
  /**
   * Type of turn detection (e.g., server VAD).
   */
  type: TurnDetectionType;

  /**
   * Activation threshold for VAD (0.0 to 1.0).
   * A higher value requires louder audio to activate the model.
   * Defaults to 0.5.
   */
  threshold?: number;

  /**
   * Amount of audio (in milliseconds) to include before the VAD detected speech.
   * Defaults to 300ms.
   */
  prefix_padding_ms?: number;

  /**
   * Duration of silence (in milliseconds) to detect speech stop.
   * Defaults to 500ms.
   */
  silence_duration_ms?: number;
}

/**
 * Definition of a tool (function) available to the model.
 */
export type Tool = OpenAIFunction;

/**
 * Main interface for the session object configuration.
 */
export interface RealtimeSession {
  /**
   * Unique identifier for the session.
   */
  id: string;

  /**
   * Object type identifier, always set to "realtime.session".
   */
  object: 'realtime.session';

  /**
   * Model to use for the session (e.g., GPT-4 Realtime Preview).
   */
  model: string;

  /**
   * Supported modalities for the session (e.g., audio, text).
   */
  modalities: Modality[];

  /**
   * Default system instructions for the model.
   * Used to guide response content and behavior.
   */
  instructions?: string;

  /**
   * AI voice used for audio responses.
   * Can only be set before the first audio response.
   */
  voice?: Voice;

  /**
   * Format of the input audio (e.g., PCM16, G711_ULAW).
   */
  input_audio_format?: AudioFormat;

  /**
   * Format of the output audio (e.g., PCM16, G711_ALAW).
   */
  output_audio_format?: AudioFormat;

  /**
   * Configuration for input audio transcription.
   * Defaults to off and can be set to null to turn off.
   */
  input_audio_transcription?: AudioTranscriptionConfig | null;

  /**
   * Configuration for turn detection.
   * Can be set to null to disable turn detection.
   */
  turn_detection?: TurnDetectionConfig | null;

  /**
   * List of tools (functions) available to the model.
   */
  tools?: Tool[];

  /**
   * How the model selects tools (e.g., auto, none, required).
   */
  tool_choice?: ToolChoice;

  /**
   * Sampling temperature for response generation.
   * Controls the randomness of the output (0.6 to 1.2). Defaults to 0.8.
   */
  temperature?: number;

  /**
   * Maximum number of output tokens for a single assistant response.
   * Can be a number (1 to 4096) or "inf" for the maximum.
   */
  max_response_output_tokens?: number | 'inf';

  /**
   * Ephemeral client secret for authenticating connections.
   */
  client_secret?: {
    /**
     * The actual ephemeral key value.
     */
    value: string;

    /**
     * Expiration timestamp for the ephemeral key.
     */
    expires_at: number;
  };
  /**
   * The WebRTC peer connection associated with this session.
   * Used for managing the connection lifecycle.
   */
  peer_connection?: RTCPeerConnection | null;

  /**
   * The WebRTC data channel associated with this session.
   * Used for sending and receiving data.
   */
  dataChannel?: RTCDataChannel | null;

  /**
   * Indicates whether the session is in the process of being established.
   */
  isConnecting?: boolean;

  /**
   * Indicates whether the session is successfully connected and ready for use.
   */
  isConnected?: boolean;

  /**
   * The local media stream used for audio output.
   */
  mediaStream?: MediaStream | null;

  /**
   * List of all transcripts associated with this session.
   * Each transcript includes details such as content, timestamp, type, and role.
   */
  transcripts: Transcript[];

  /**
   * List of errors that have occurred during this session.
   * This array is updated whenever an error event is received.
   */
  errors?: SessionError[];
  /**
   * Tracks token usage statistics for the session.
   */
  tokenUsage?: TokenUsage;
  /**
   * Indicates whether the session audio is muted.
   */
  isMuted?: boolean;

  /**
   * ISO 8601 timestamp when the session was started
   */
  startTime?: string;

  /**
   * ISO 8601 timestamp when the session was ended
   */
  endTime?: string;

  /**
   * Duration of the session in seconds
   * Calculated as the difference between endTime and startTime
   */
  duration?: number;

  /**
   * Timeout in milliseconds for ICE connection.
   * @default 10000
   */
  connection_timeout: number;

  /**
   * Current connection status of the session
   */
  connectionStatus?: ConnectionStatus;

  /**
   * Timestamp of the last connection state change
   */
  lastStateChange?: string;

  /**
   * Custom audio settings for the session.
   * Allows developers to specify their own settings for audio input.
   */
  audioSettings?: AudioSettings;

  /**
   * Indicates whether the session currently has an active audio track.
   */
  hasAudio?: boolean;
}

export type OpenAICreateSessionParams = Pick<
  RealtimeSession,
  | 'modalities'
  | 'instructions'
  | 'tools'
  | 'turn_detection'
  | 'input_audio_transcription'
  | 'voice'
  | 'output_audio_format'
  | 'temperature'
  | 'max_response_output_tokens'
>;

/**
 * Type definition for the request body to create a new session in the OpenAI Realtime API.
 */
export interface SessionConfig extends OpenAICreateSessionParams {
  /**
   * Optional timeout in milliseconds for ICE connection.
   * Defaults to 10000 (10 seconds) if not specified.
   */
  connection_timeout?: number;
  model?: null;
}

/**
 * Type definition for the request body of a session update event in the OpenAI Realtime API.
 */
export interface UpdateSessionRequest {
  /**
   * Optional client-generated ID to identify this event.
   */
  event_id?: string;

  /**
   * The type of the event, always set to "session.update".
   */
  type: 'session.update';

  /**
   * The updated session configuration object.
   * Only provided fields will be updated. To clear fields like `instructions`, pass an empty string.
   */
  session: Partial<Omit<RealtimeSession, 'id' | 'object' | 'clientSecret'>>;
}

/**
 * Type definition for an OpenAI function schema.
 */
export interface OpenAIFunction {
  /**
   * The type of tool. Always set to "function" for OpenAI function calls.
   */
  type: 'function';

  /**
   * A unique name for the function.
   */
  name: string;

  /**
   * A short, human-readable description of what the function does.
   */
  description: string;

  /**
   * Parameters schema for the function, following JSON Schema standards.
   */
  parameters: {
    /**
     * The type of the schema. Always "object".
     */
    type: 'object';

    /**
     * Properties (parameters) accepted by the function.
     */
    properties: {
      [key: string]: {
        /**
         * The type of the property (e.g., string, number, object, etc.).
         */
        type: 'string' | 'number' | 'boolean' | 'object' | 'array';

        /**
         * Optional description of the parameter.
         */
        description?: string;

        /**
         * Optional enumeration of allowed values (only for string, number, or array types).
         */
        enum?: string[] | number[];

        /**
         * Properties for nested objects (applicable if `type` is "object").
         */
        properties?: {
          [key: string]: unknown;
        };

        /**
         * Required parameters for nested objects (applicable if `type` is "object").
         */
        required?: string[];
      };
    };

    /**
     * List of required properties for the function.
     */
    required: string[];

    /**
     * Whether additional properties outside of those defined in `properties` are allowed.
     */
    additionalProperties: boolean;
  };
}

/**
 * Tracks token usage for the session.
 */
export interface TokenUsage {
  /**
   * Number of input tokens used by the session.
   */
  inputTokens: number;

  /**
   * Number of output tokens generated by the session.
   */
  outputTokens: number;

  /**
   * Total number of tokens (input + output) used in the session.
   */
  totalTokens: number;
}

export type FunctionCallHandler = (
  name: string,
  args: Record<string, unknown>
) => void;

export type StartSession = (
  realtimeSession: RealtimeSession,
  functionCallHandler?: FunctionCallHandler
) => void;

/**
 * Options for closing a WebRTC session.
 */
export interface SessionCloseOptions {
  /**
   * Whether to remove the session from state after closing the connection.
   * Set to false to keep the session data for analytics or other purposes.
   * @default true
   */
  removeAfterConnectionClose?: boolean;
}

/**
 * Enum representing possible WebRTC connection states
 */
export enum ConnectionStatus {
  INITIALIZING = 'initializing',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  FAILED = 'failed',
  CLOSED = 'closed',
  RECONNECTING = 'reconnecting',
}

/**
 * Enum for WebRTC error types
 */
export enum WebRTCErrorType {
  CONNECTION_ERROR = 'connection_error',
  DATA_CHANNEL_ERROR = 'data_channel_error',
  MEDIA_ERROR = 'media_error',
  SIGNALING_ERROR = 'signaling_error',
  UNKNOWN_ERROR = 'unknown_error',
}

/**
 * Enum for specific WebRTC error codes
 */
export enum WebRTCErrorCode {
  ICE_CONNECTION_FAILED = 'ice_connection_failed',
  ICE_CONNECTION_TIMEOUT = 'ice_connection_timeout',
  DATA_CHANNEL_FAILED = 'data_channel_failed',
  MEDIA_ACCESS_DENIED = 'media_access_denied',
  SIGNALING_FAILED = 'signaling_failed',
}

/**
 * Custom audio settings for the session.
 * Allows developers to specify their own settings for audio input.
 */
export interface AudioSettings {
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
  sampleRate?: number;
}
