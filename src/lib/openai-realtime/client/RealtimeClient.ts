import { ClientEventType } from '../types/client-events';
import {
  SessionConfig,
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
}

export class RealtimeClient {
  private config: RealtimeClientConfig;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private micActive: boolean = false;
  private sessionId?: string;
  private pc?: RTCPeerConnection;
  private dataChannel?: RTCDataChannel;

  // Enhanced state management
  private conversationState: ConversationState = {
    items: [],
    currentResponseId: undefined,
    isResponding: false,
  };

  constructor(config: RealtimeClientConfig) {
    console.log('[RealtimeClient] Constructor called with config:', config);
    this.config = config;
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
        this.config.onSpeechStarted?.();
        break;
      }
      case ServerEventType.INPUT_AUDIO_BUFFER_SPEECH_STOPPED: {
        this.config.onSpeechStopped?.();
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

      const offer = await this.pc.createOffer();
      await this.pc.setLocalDescription(offer);

      const url = new URL(this.config.realtimeUrl);
      url.searchParams.set('model', this.config.model || '');

      console.log('[RealtimeClient] Connecting to:', url.toString());
      console.log(
        '[RealtimeClient] Client secret length:',
        this.config.clientSecret?.length || 0
      );
      console.log(
        '[RealtimeClient] Client secret starts with:',
        this.config.clientSecret?.substring(0, 10) + '...'
      );

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

      this.pc.ontrack = (ev) => {
        const [trackStream] = ev.streams;
        this.handleRemoteAudio(trackStream);
      };
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

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioTrack = stream.getAudioTracks()[0];
      this.pc.addTrack(audioTrack, stream);
      this.micActive = true;
    } catch (err) {
      this.config.onError?.(
        err instanceof Error ? err : new Error(String(err))
      );
    }
  }

  async stopVoiceInput(): Promise<void> {
    if (!this.pc) return;

    // Stop and remove all audio tracks from the peer connection
    this.pc.getSenders().forEach((sender) => {
      if (sender.track?.kind === 'audio') {
        sender.track.stop();
        this.pc?.removeTrack(sender);
      }
    });

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
    };
  }

  // High-level conversation methods
  async sendTextMessage(
    text: string,
    role: MessageRole = MessageRole.USER
  ): Promise<void> {
    const item: Item = {
      id: `item_${Date.now()}`,
      type: ItemType.MESSAGE,
      role: role,
      object: ObjectType.ITEM,
      content: [
        {
          type: ContentType.TEXT,
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
}
