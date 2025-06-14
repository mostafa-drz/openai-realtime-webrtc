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
  FABLE = 'fable',
  ONYX = 'onyx',
  NOVA = 'nova',
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

// Session Configuration Types
export interface SessionConfig {
  client_secret?: ClientSecretConfig;
  input_audio_format?: AudioFormat; // Default: 'pcm16'
  input_audio_noise_reduction?: NoiseReductionConfig | null;
  input_audio_transcription?: TranscriptionConfig | null;
  instructions?: string;
  max_response_output_tokens?: MaxTokens;
  modalities?: Modality[];
  model?: string;
  output_audio_format?: AudioFormat; // Default: 'pcm16'
  speed?: Speed;
  temperature?: Temperature;
  tool_choice?: ToolChoice;
  tools?: Tool[];
  tracing?: 'auto' | TracingConfig | null;
  turn_detection?: TurnDetectionConfig;
  voice?: Voice;
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
  object: 'realtime.item';
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

export interface CreateSessionResponse {
  id: string;
  object: 'realtime.session';
  model: string;
  modalities: Modality[];
  instructions?: string;
  voice: Voice;
  input_audio_format: AudioFormat;
  output_audio_format: AudioFormat;
  input_audio_transcription?: TranscriptionConfig;
  turn_detection: TurnDetectionConfig;
  tools: Tool[];
  tool_choice: ToolChoice;
  temperature: Temperature;
  max_response_output_tokens: MaxTokens;
  speed: Speed;
  tracing: 'auto' | TracingConfig | null;
  client_secret: ClientSecret;
}

export interface CreateTranscriptionSessionResponse {
  id: string;
  object: 'realtime.transcription_session';
  modalities: Modality[];
  turn_detection: TurnDetectionConfig;
  input_audio_format: AudioFormat;
  input_audio_transcription: TranscriptionConfig;
  client_secret: ClientSecret | null;
}
