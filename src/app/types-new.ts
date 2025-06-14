/**
 * OpenAI Realtime API Types
 * @packageDocumentation
 *
 * Typing Philosophy:
 * 1. Types should be as restrictive as possible based on the API documentation
 * 2. Conditional types should be used when a field's type depends on another field
 * 3. Default values should be documented in comments
 * 4. Field constraints (min/max values, allowed values) should be documented
 * 5. Fields that are only valid in certain contexts should be properly typed
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

// Main Types
export interface CreateSessionRequest extends SessionConfig {}

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

// Transcription Session Types
export interface CreateTranscriptionSessionRequest {
  client_secret?: ClientSecretConfig;
  include?: null[]; // Current available items are null
  input_audio_format?: AudioFormat; // Default: 'pcm16'
  input_audio_noise_reduction?: NoiseReductionConfig | null;
  input_audio_transcription?: TranscriptionConfig;
  modalities?: Modality[];
  turn_detection?: TurnDetectionConfig;
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
