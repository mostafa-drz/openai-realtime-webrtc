import { ClientEventType } from '../types/client-events';
import {
  SessionConfig,
  TranscriptionSessionConfig,
  ConnectionState,
  Item,
  ResponseConfig,
  ItemType,
  ContentType,
  MessageRole,
  Response,
  ObjectType,
} from '../types/core';
import { ServerEvent, ServerEventType } from '../types/server-events';

export interface RealtimeClientConfig {
  clientSecret: string;
  model?: string;
  realtimeUrl: string;
  dataChannelLabel?: string;
  sessionType?: SessionType;
  onMessageToken?: (token: string) => void;
  onTranscript?: (text: string) => void;
  onConnectionStateChange?: (
    state: 'connecting' | 'connected' | 'disconnected' | 'error'
  ) => void;
  onError?: (error: Error) => void;
  // New high-level callbacks
  onConversationItemCreated?: (item: Item) => void;
  onResponseCreated?: (response: Response) => void;
  onResponseDone?: (response: Response) => void;
  onSpeechStarted?: () => void;
  onSpeechStopped?: () => void;
  // Raw event access
  onRawEvent?: (event: ServerEvent) => void;
}

export interface ConversationState {
  items: Item[];
  currentResponseId?: string;
  isResponding: boolean;
  isSpeaking: boolean;
  hasAudioBuffer: boolean;
}

export type SessionType = 'regular' | 'transcription';

export class RealtimeClient {
  private config: RealtimeClientConfig;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private micActive: boolean = false;
  private sessionId?: string;
  private sessionType: SessionType;
  private pc?: RTCPeerConnection;
  private dataChannel?: RTCDataChannel;

  // Enhanced state management
  private conversationState: ConversationState = {
    items: [],
    currentResponseId: undefined,
    isResponding: false,
    isSpeaking: false,
    hasAudioBuffer: false,
  };

  constructor(config: RealtimeClientConfig) {
    this.config = config;
    this.sessionType = config.sessionType || 'regular';
  }

  private updateState(state: ConnectionState) {
    this.connectionState = state;
    this.config.onConnectionStateChange?.(state);
  }

  private sendEvent(event: Record<string, unknown>) {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel is not open.');
    }
    this.dataChannel.send(JSON.stringify(event));
  }

  private handleServerEvent(event: ServerEvent) {
    // Always call raw event handler first
    this.config.onRawEvent?.(event);

    switch (event.type) {
      case ServerEventType.SESSION_CREATED: {
        this.sessionId = event.session.id;
        // Detect session type based on object type
        // Use type assertion since the API supports both session types
        const sessionObject = (event.session as { object: string }).object;
        this.sessionType =
          sessionObject === ObjectType.TRANSCRIPTION_SESSION
            ? 'transcription'
            : 'regular';
        break;
      }
      case ServerEventType.TRANSCRIPTION_SESSION_UPDATED: {
        this.sessionType = 'transcription';
        break;
      }
      case ServerEventType.RESPONSE_TEXT_DELTA: {
        const token = event?.delta || '';
        this.config.onMessageToken?.(token);
        break;
      }
      case ServerEventType.RESPONSE_AUDIO_TRANSCRIPT_DELTA: {
        const transcript = event?.delta || '';
        this.config.onTranscript?.(transcript);
        break;
      }
      case ServerEventType.INPUT_AUDIO_BUFFER_SPEECH_STARTED: {
        this.conversationState.isSpeaking = true;
        this.config.onSpeechStarted?.();
        break;
      }
      case ServerEventType.INPUT_AUDIO_BUFFER_SPEECH_STOPPED: {
        this.conversationState.isSpeaking = false;
        this.config.onSpeechStopped?.();
        break;
      }
      case ServerEventType.INPUT_AUDIO_BUFFER_COMMITTED: {
        this.conversationState.hasAudioBuffer = false;
        break;
      }
      case ServerEventType.CONVERSATION_ITEM_CREATED: {
        this.conversationState.items.push(event.item);
        this.config.onConversationItemCreated?.(event.item);
        break;
      }
      case ServerEventType.RESPONSE_CREATED: {
        this.conversationState.currentResponseId = event.response.id;
        this.conversationState.isResponding = true;
        this.config.onResponseCreated?.(event.response);
        break;
      }
      case ServerEventType.RESPONSE_DONE: {
        this.conversationState.isResponding = false;
        this.config.onResponseDone?.(event.response);
        break;
      }
      case ServerEventType.ERROR: {
        const error = new Error(event?.error.message || 'Unknown server error');
        this.config.onError?.(error);
        break;
      }
      default: {
        console.debug('[RealtimeClient] Unhandled server event:', event);
      }
    }
  }

  private handleRemoteAudio(stream: MediaStream) {
    const audio = document.createElement('audio');
    audio.autoplay = true;
    audio.srcObject = stream;
    document.body.appendChild(audio); // optionally append to DOM
  }

  async connect(): Promise<void> {
    this.updateState(ConnectionState.CONNECTING);

    try {
      this.pc = new RTCPeerConnection();

      // Set up remote audio handling FIRST (like OpenAI example)
      this.pc.ontrack = (ev) => {
        const [trackStream] = ev.streams;
        this.handleRemoteAudio(trackStream);
      };

      // Add local audio track (using OpenAI's exact method)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.pc.addTrack(stream.getTracks()[0]);

      // Set up data channel
      const label = this.config.dataChannelLabel || 'oai-events';
      this.dataChannel = this.pc.createDataChannel(label);
      this.dataChannel.onmessage = (ev) => {
        this.handleServerEvent(JSON.parse(ev.data));
      };

      this.pc.onconnectionstatechange = () => {
        const state = this.pc!.connectionState;
        if (['connected', 'disconnected', 'failed', 'closed'].includes(state)) {
          this.updateState(
            state === 'connected'
              ? ConnectionState.CONNECTED
              : ConnectionState.DISCONNECTED
          );
        }
      };

      // Create offer
      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      const url = new URL(this.config.realtimeUrl);

      // Only set model parameter for regular sessions, not transcription sessions
      if (this.sessionType === 'regular' && this.config.model) {
        url.searchParams.set('model', this.config.model);
      }

      const resp = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp',
          Authorization: `Bearer ${this.config.clientSecret}`,
        },
        body: offer.sdp,
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        console.error(
          '[RealtimeClient] SDP request failed:',
          resp.status,
          errorText
        );
        throw new Error(`SDP request failed: ${resp.status} - ${errorText}`);
      }

      const answerSdp = await resp.text();
      await this.pc.setRemoteDescription({ type: 'answer', sdp: answerSdp });
    } catch (err) {
      this.updateState(ConnectionState.ERROR);
      this.config.onError?.(
        err instanceof Error ? err : new Error(String(err))
      );
      return;
    }
  }

  async startVoiceInput(): Promise<void> {
    if (!this.pc || !this.dataChannel) {
      throw new Error(
        'PeerConnection is not initialized. Call connect() first.'
      );
    }

    if (this.micActive) return;

    // Audio track is already added during connection, just mark as active
    this.micActive = true;
  }

  async stopVoiceInput(): Promise<void> {
    if (!this.pc) return;

    // Note: We don't remove the audio track since it's needed for the connection
    // We just mark the mic as inactive for UI purposes
    this.micActive = false;
  }

  updateSession(config: Partial<SessionConfig>): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel is not open.');
    }

    const event = {
      type: ClientEventType.SESSION_UPDATE,
      session: {
        ...this.config,
        ...config,
      },
    };
    this.dataChannel.send(JSON.stringify(event));
  }

  updateTranscriptionSession(
    config: Partial<TranscriptionSessionConfig>
  ): void {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel is not open.');
    }

    const event = {
      type: ClientEventType.TRANSCRIPTION_SESSION_UPDATE,
      session: config,
    };
    this.dataChannel.send(JSON.stringify(event));
  }

  async disconnect(): Promise<void> {
    try {
      this.pc?.getSenders().forEach((sender) => {
        sender.track?.stop();
        this.pc?.removeTrack(sender);
      });

      this.pc?.close();
      this.pc = undefined;

      this.dataChannel?.close();
      this.dataChannel = undefined;

      this.sessionId = undefined;
      this.micActive = false;

      this.updateState(ConnectionState.DISCONNECTED);
    } catch (err) {
      this.updateState(ConnectionState.ERROR);
      this.config.onError?.(
        err instanceof Error ? err : new Error(String(err))
      );
    }
  }

  isConnected(): boolean {
    return this.connectionState === ConnectionState.CONNECTED;
  }

  getStatus() {
    return {
      connection: this.connectionState,
      isMicStreaming: this.micActive,
      sessionId: this.sessionId,
      sessionType: this.sessionType,
    };
  }

  // High-level conversation methods
  async sendTextMessage(
    text: string,
    role: MessageRole = MessageRole.USER
  ): Promise<void> {
    if (this.sessionType === 'transcription') {
      throw new Error(
        'Text messages are not supported in transcription sessions'
      );
    }

    const item = {
      id: `item_${Date.now()}`,
      type: ItemType.MESSAGE,
      role: role,
      content: [
        {
          type: ContentType.INPUT_TEXT,
          text: text,
        },
      ],
    };

    const event = {
      type: ClientEventType.CONVERSATION_ITEM_CREATE,
      item: item,
    };

    this.sendEvent(event);
  }

  async requestResponse(options?: Partial<ResponseConfig>): Promise<void> {
    if (this.sessionType === 'transcription') {
      throw new Error(
        'AI responses are not supported in transcription sessions'
      );
    }

    const responseConfig: ResponseConfig = {
      ...options,
    };

    const event = {
      type: ClientEventType.RESPONSE_CREATE,
      response: responseConfig,
    };

    this.sendEvent(event);
  }

  async cancelResponse(reason?: string): Promise<void> {
    if (this.sessionType === 'transcription') {
      throw new Error(
        'AI responses are not supported in transcription sessions'
      );
    }

    const event = {
      type: ClientEventType.RESPONSE_CANCEL,
      reason: reason || 'User cancelled',
    };

    this.sendEvent(event);
  }

  async commitAudioBuffer(): Promise<void> {
    const event = {
      type: ClientEventType.INPUT_AUDIO_BUFFER_COMMIT,
    };

    this.sendEvent(event);
  }

  async clearAudioBuffer(): Promise<void> {
    const event = {
      type: ClientEventType.INPUT_AUDIO_BUFFER_CLEAR,
    };

    this.sendEvent(event);
  }

  async clearOutputAudioBuffer(): Promise<void> {
    const event = {
      type: ClientEventType.OUTPUT_AUDIO_BUFFER_CLEAR,
    };

    this.sendEvent(event);
  }

  // State getters
  getConversationState(): ConversationState {
    return { ...this.conversationState };
  }

  getConversationItems(): Item[] {
    return [...this.conversationState.items];
  }

  isResponding(): boolean {
    return this.conversationState.isResponding;
  }

  // Audio Buffer Management
  async appendAudioData(audioBase64: string): Promise<void> {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel is not open.');
    }

    const event = {
      type: ClientEventType.INPUT_AUDIO_BUFFER_APPEND,
      audio: audioBase64,
    };
    this.sendEvent(event);
    this.conversationState.hasAudioBuffer = true;
  }

  // Enhanced Conversation Management
  async retrieveConversationItem(itemId: string): Promise<void> {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel is not open.');
    }

    const event = {
      type: ClientEventType.CONVERSATION_ITEM_RETRIEVE,
      item_id: itemId,
    };
    this.sendEvent(event);
  }

  async truncateConversationItem(audioEndMs: number): Promise<void> {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel is not open.');
    }

    const event = {
      type: ClientEventType.CONVERSATION_ITEM_TRUNCATE,
      audio_end_ms: audioEndMs,
    };
    this.sendEvent(event);
  }

  async deleteConversationItem(): Promise<void> {
    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel is not open.');
    }

    const event = {
      type: ClientEventType.CONVERSATION_ITEM_DELETE,
    };
    this.sendEvent(event);
  }

  // Enhanced Response Management
  async cancelSpecificResponse(
    responseId: string,
    reason?: string
  ): Promise<void> {
    if (this.sessionType === 'transcription') {
      throw new Error(
        'AI responses are not supported in transcription sessions'
      );
    }

    if (!this.dataChannel || this.dataChannel.readyState !== 'open') {
      throw new Error('Data channel is not open.');
    }

    const event = {
      type: ClientEventType.RESPONSE_CANCEL,
      response_id: responseId,
      reason: reason || 'User cancelled',
    };
    this.sendEvent(event);
  }

  // Enhanced State Getters
  isSpeaking(): boolean {
    return this.conversationState.isSpeaking;
  }

  hasAudioBuffer(): boolean {
    return this.conversationState.hasAudioBuffer;
  }
}
