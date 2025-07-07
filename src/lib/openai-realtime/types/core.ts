/**
 * OpenAI Realtime API Core Types
 * @packageDocumentation
 */

// Enums
export enum AudioFormat {
  PCM16 = 'pcm16', // 16-bit PCM at 24kHz, mono, little-endian
  G711_ULAW = 'g711_ulaw',
  G711_ALAW = 'g711_alaw',
}

export enum TurnDetectionType {
  SERVER_VAD = 'server_vad',
  SEMANTIC_VAD = 'semantic_vad',
}

export enum VADEagerness {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  AUTO = 'auto', // Default, equivalent to medium
}

export enum ToolChoice {
  AUTO = 'auto', // Default
  NONE = 'none',
  REQUIRED = 'required',
}

export enum Modality {
  AUDIO = 'audio',
  TEXT = 'text',
}

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

export enum TranscriptionModel {
  GPT4O_TRANSCRIBE = 'gpt-4o-transcribe',
  GPT4O_MINI_TRANSCRIBE = 'gpt-4o-mini-transcribe',
  WHISPER_1 = 'whisper-1',
}

export enum ContentType {
  INPUT_TEXT = 'input_text',
  INPUT_AUDIO = 'input_audio',
  ITEM_REFERENCE = 'item_reference',
  TEXT = 'text',
}

export enum ItemType {
  MESSAGE = 'message',
  FUNCTION_CALL = 'function_call',
  FUNCTION_CALL_OUTPUT = 'function_call_output',
}

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
}

export enum ItemStatus {
  COMPLETED = 'completed',
  INCOMPLETE = 'incomplete',
}

export enum ConnectionState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

// Atomic Types with constraints
export type Seconds = number; // Range: 10-7200, Default: 600
export type Milliseconds = number;
export type Temperature = number; // Range: 0.6-1.2, Default: 0.8
export type Speed = number; // Range: 0.25-1.5, Default: 1.0
export type Threshold = number; // Range: 0.0-1.0, Default: 0.5
export type MaxTokens = number | 'inf'; // Range: 1-4096 or 'inf', Default: 'inf'
export type EventId = string;

// Complex Types
export interface ExpirationConfig {
  anchor?: 'created_at'; // Only supported value
  seconds?: Seconds;
}

export interface ClientSecretConfig {
  expires_at?: ExpirationConfig;
}

export interface NoiseReductionConfig {
  type: 'near_field' | 'far_field'; // Required when config is present
}

export interface TranscriptionConfig {
  language?: string | null; // ISO-639-1 format (e.g., 'en')
  model: TranscriptionModel; // Required when config is present
  prompt?: string; // Keywords for whisper-1, free text for gpt-4o-transcribe models
}

// Conditional types for turn detection
export interface BaseTurnDetectionConfig {
  create_response?: boolean; // Default: true
  interrupt_response?: boolean; // Default: true
  type: TurnDetectionType;
}

export interface ServerVADConfig extends BaseTurnDetectionConfig {
  type: TurnDetectionType.SERVER_VAD;
  prefix_padding_ms?: Milliseconds; // Default: 300ms
  silence_duration_ms?: Milliseconds; // Default: 500ms
  threshold?: Threshold; // Default: 0.5
}

export interface SemanticVADConfig extends BaseTurnDetectionConfig {
  type: TurnDetectionType.SEMANTIC_VAD;
  eagerness?: VADEagerness; // Default: 'auto'
}

export type TurnDetectionConfig = ServerVADConfig | SemanticVADConfig | null;

export interface ToolParameter {
  type: string;
  description?: string;
  [key: string]: string | number | boolean | null | undefined;
}

export interface Tool {
  type: 'function';
  name: string;
  description?: string;
  parameters?: ToolParameter;
}

export interface TracingConfig {
  workflow_name?: string;
  group_id?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

/**
 * Base configuration shared between regular and transcription sessions
 */
export interface BaseSessionConfig {
  /** Configuration for client secret expiration */
  client_secret?: ClientSecretConfig;
  /** Audio format for input, defaults to PCM16 */
  input_audio_format?: AudioFormat;
  /** Configuration for noise reduction, can be disabled with null */
  input_audio_noise_reduction?: NoiseReductionConfig | null;
  /** Configuration for audio transcription, can be disabled with null */
  input_audio_transcription?: TranscriptionConfig | null;
  /** Supported modalities for the session */
  modalities?: Modality[];
  /** Configuration for turn detection */
  turn_detection?: TurnDetectionConfig;
}

/**
 * Configuration for a regular session
 */
export interface SessionConfig extends BaseSessionConfig {
  /** System instructions for the model */
  instructions?: string;
  /** Maximum number of tokens in the response */
  max_response_output_tokens?: MaxTokens;
  /** Model to use for the session */
  model?: string;
  /** Audio format for output, defaults to PCM16 */
  output_audio_format?: AudioFormat;
  /** Speech speed for audio output */
  speed?: Speed;
  /** Temperature for response generation */
  temperature?: Temperature;
  /** Tool choice configuration */
  tool_choice?: ToolChoice;
  /** Available tools for the session */
  tools?: Tool[];
  /** Tracing configuration */
  tracing?: TracingType | TracingConfig | null;
  /** Voice to use for audio output */
  voice?: Voice;
}

/**
 * Configuration for a transcription session
 * Only includes fields supported by the OpenAI transcription session API
 * Transcription sessions are purely for audio-to-text conversion, no AI responses
 */
export interface TranscriptionSessionConfig {
  /** Configuration for client secret expiration */
  client_secret?: ClientSecretConfig;
  /** Audio format for input, defaults to PCM16 */
  input_audio_format?: AudioFormat;
  /** Configuration for noise reduction, can be disabled with null */
  input_audio_noise_reduction?: NoiseReductionConfig | null;
  /** Required configuration for audio transcription */
  input_audio_transcription: TranscriptionConfig;
  /** Configuration for turn detection */
  turn_detection?: TurnDetectionConfig;
  /** Additional fields to include in the response */
  include?: string[];
}

/**
 * Base response type for session creation
 */
export interface BaseSessionResponse {
  /** Unique ID of the session */
  id: string;
  /** Object type */
  object: ObjectType;
  /** Supported modalities for the session */
  modalities: Modality[];
  /** Configuration for turn detection */
  turn_detection: TurnDetectionConfig;
  /** Audio format for input */
  input_audio_format: AudioFormat;
  /** Configuration for audio transcription */
  input_audio_transcription: TranscriptionConfig;
  /** Client secret for authentication */
  client_secret: ClientSecret;
}

/**
 * Response from creating a regular session
 */
export interface CreateSessionResponse extends BaseSessionResponse {
  object: ObjectType.SESSION;
  /** Model to use for the session */
  model: string;
  /** System instructions for the model */
  instructions?: string;
  /** Voice to use for audio output */
  voice: Voice;
  /** Audio format for output */
  output_audio_format: AudioFormat;
  /** Available tools for the session */
  tools: Tool[];
  /** Tool choice configuration */
  tool_choice: ToolChoice;
  /** Temperature for response generation */
  temperature: Temperature;
  /** Maximum number of tokens in the response */
  max_response_output_tokens: MaxTokens;
  /** Speech speed for audio output */
  speed: Speed;
  /** Tracing configuration */
  tracing: TracingType | TracingConfig | null;
}

/**
 * Response from creating a transcription session
 * Transcription sessions have a different structure than regular sessions
 */
export interface CreateTranscriptionSessionResponse {
  /** Unique ID of the session */
  id: string;
  /** Object type */
  object: ObjectType.TRANSCRIPTION_SESSION;
  /** Configuration for turn detection */
  turn_detection: TurnDetectionConfig;
  /** Audio format for input */
  input_audio_format: AudioFormat;
  /** Configuration for audio transcription */
  input_audio_transcription: TranscriptionConfig;
  /** Client secret for authentication */
  client_secret: ClientSecret;
}

/**
 * Transcription session response type for events
 */
export interface TranscriptionSessionResponse {
  /** Unique ID of the session */
  id: string;
  /** Object type */
  object: ObjectType.TRANSCRIPTION_SESSION;
  /** Configuration for turn detection */
  turn_detection: TurnDetectionConfig;
  /** Audio format for input */
  input_audio_format: AudioFormat;
  /** Configuration for audio transcription */
  input_audio_transcription: TranscriptionConfig;
}

// Object Types
export enum ObjectType {
  SESSION = 'realtime.session',
  TRANSCRIPTION_SESSION = 'realtime.transcription_session',
  CONVERSATION = 'realtime.conversation',
  ITEM = 'realtime.item',
  RESPONSE = 'realtime.response',
}

export enum ToolType {
  FUNCTION = 'function',
}

export enum NoiseReductionType {
  NEAR_FIELD = 'near_field',
  FAR_FIELD = 'far_field',
}

export enum TracingType {
  AUTO = 'auto',
}

// Session Response Types
export interface SessionResponse extends SessionConfig {
  id: string;
  object: ObjectType.SESSION;
}

// Content Interfaces
export interface BaseContent {
  type: ContentType;
}

export interface TextContent extends BaseContent {
  type: ContentType.INPUT_TEXT | ContentType.TEXT;
  text: string;
}

export interface AudioContent extends BaseContent {
  type: ContentType.INPUT_AUDIO;
  audio: string; // Base64-encoded audio bytes
  transcript?: string;
}

export interface ItemReferenceContent extends BaseContent {
  type: ContentType.ITEM_REFERENCE;
  id: string;
}

export type Content = TextContent | AudioContent | ItemReferenceContent;

// Item Interfaces
export interface BaseItem {
  id?: string;
  type: ItemType;
  status?: ItemStatus;
  object: ObjectType.ITEM;
}

export interface MessageItem extends BaseItem {
  type: ItemType.MESSAGE;
  role: MessageRole;
  content: Content[];
}

export interface FunctionCallItem extends BaseItem {
  type: ItemType.FUNCTION_CALL;
  name: string;
  arguments: string;
  call_id: string;
}

export interface FunctionCallOutputItem extends BaseItem {
  type: ItemType.FUNCTION_CALL_OUTPUT;
  call_id: string;
  output: string;
}

export type Item = MessageItem | FunctionCallItem | FunctionCallOutputItem;

// Session Response Types
export interface ClientSecret {
  value: string;
  expires_at: number;
}

// Response Configuration Types
export interface ResponseConfig {
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
}

// Conversation Types
export interface Conversation {
  id: string;
  object: ObjectType.CONVERSATION;
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
 * Log probability for a token in transcription
 */
export interface LogProbability {
  /** The bytes that were used to generate the log probability */
  bytes: number[];
  /** The log probability of the token */
  logprob: number;
  /** The token that was used to generate the log probability */
  token: string;
}

/**
 * Base error details interface
 * Used for both API errors and transcription errors
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
 * Response status types
 * These indicate the current state of a response in the system
 */
export enum ResponseStatus {
  /** Response is currently being generated */
  IN_PROGRESS = 'in_progress',
  /** Response has completed successfully */
  COMPLETED = 'completed',
  /** Response was cancelled by the client */
  CANCELLED = 'cancelled',
  /** Response failed due to an error */
  FAILED = 'failed',
  /** Response was incomplete due to token limits or other constraints */
  INCOMPLETE = 'incomplete',
}

/**
 * Response status reason types
 * These provide additional context about why a response reached its current status
 */
export enum ResponseStatusReason {
  /** Response was interrupted by user speech detection */
  TURN_DETECTED = 'turn_detected',
  /** Response was cancelled by client request */
  CLIENT_CANCELLED = 'client_cancelled',
  /** Response hit the maximum output token limit */
  MAX_OUTPUT_TOKENS = 'max_output_tokens',
  /** Response was filtered due to content policy */
  CONTENT_FILTER = 'content_filter',
}

/**
 * Response status details
 */
export interface ResponseStatusDetails {
  /** Error details if status is failed */
  error?: ErrorDetails;
  /** Reason for the status */
  reason?: ResponseStatusReason;
  /** Type of status */
  type: ResponseStatus;
}

/**
 * Cached token details
 */
export interface CachedTokenDetails {
  /** Number of text tokens cached */
  text_tokens: number;
  /** Number of audio tokens cached */
  audio_tokens: number;
}

/**
 * Input token details
 */
export interface InputTokenDetails {
  /** Number of cached tokens */
  cached_tokens: number;
  /** Number of text tokens */
  text_tokens: number;
  /** Number of audio tokens */
  audio_tokens: number;
  /** Details about cached tokens */
  cached_tokens_details: CachedTokenDetails;
}

/**
 * Output token details
 */
export interface OutputTokenDetails {
  /** Number of text tokens */
  text_tokens: number;
  /** Number of audio tokens */
  audio_tokens: number;
  /** Total number of output tokens */
  output_tokens: number;
}

/**
 * Response usage statistics
 */
export interface ResponseUsage {
  /** Total tokens used */
  total_tokens: number;
  /** Number of input tokens */
  input_tokens: number;
  /** Number of output tokens */
  output_tokens: number;
  /** Input token details */
  input_token_details: InputTokenDetails;
  /** Output token details */
  output_token_details: OutputTokenDetails;
}

/**
 * Response resource
 */
export interface Response {
  /** Unique ID of the response */
  id: string;
  /** Object type */
  object: 'realtime.response';
  /** Which conversation the response is added to */
  conversation_id: string | null;
  /** Maximum number of output tokens */
  max_output_tokens: MaxTokens;
  /** Additional metadata */
  metadata?: Record<string, string>;
  /** Set of modalities the model used to respond */
  modalities: Modality[];
  /** List of output items */
  output: Item[];
  /** Format of output audio */
  output_audio_format: AudioFormat;
  /** Current status of the response */
  status: ResponseStatus;
  /** Additional status details */
  status_details: ResponseStatusDetails | null;
  /** Sampling temperature used */
  temperature: Temperature;
  /** Usage statistics */
  usage: ResponseUsage | null;
  /** Voice used for audio output */
  voice: Voice;
}

/**
 * Text content part for response streaming
 */
export interface TextResponseContentPart {
  /** The content type */
  type: 'text';
  /** The text content */
  text: string;
}

/**
 * Audio content part for response streaming
 */
export interface AudioResponseContentPart {
  /** The content type */
  type: 'audio';
  /** Base64-encoded audio data */
  audio: string;
  /** The transcript of the audio */
  transcript?: string;
}

/**
 * Content part for response streaming
 * Used in response.content_part events
 */
export type ResponseContentPart =
  | TextResponseContentPart
  | AudioResponseContentPart;

/**
 * Base interface for client events
 */
export interface BaseClientEvent {
  /** Optional event ID for tracking */
  event_id?: EventId;
}

/**
 * Base interface for response-related events
 */
export interface BaseResponseEvent extends BaseClientEvent {
  /** The ID of the Response */
  response_id: string;
  /** The ID of the item */
  item_id: string;
  /** The index of the output item in the response */
  output_index: number;
  /** The index of the content part in the item's content array */
  content_index: number;
}

/**
 * Base interface for delta events
 */
export interface BaseDeltaEvent extends BaseResponseEvent {
  /** The delta content */
  delta: string;
}

/**
 * Base interface for done events
 */
export interface BaseDoneEvent extends BaseResponseEvent {
  /** The final content */
  content: string;
}

/**
 * Rate limit types
 */
export enum RateLimitName {
  /** Rate limit for number of requests */
  REQUESTS = 'requests',
  /** Rate limit for number of tokens */
  TOKENS = 'tokens',
}

/**
 * Rate limit information
 */
export interface RateLimit {
  /** The name of the rate limit */
  name: RateLimitName;
  /** The maximum allowed value for the rate limit */
  limit: number;
  /** The remaining value before the limit is reached */
  remaining: number;
  /** Seconds until the rate limit resets */
  reset_seconds: number;
}
