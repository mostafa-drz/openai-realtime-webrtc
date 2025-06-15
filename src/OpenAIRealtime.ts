import { EventManager } from './EventManager';
import { StateManager } from './StateManager';
import {
  SessionConfig,
  ItemType,
  MessageRole,
  ContentType,
  CreateSessionResponse,
  CreateTranscriptionSessionResponse,
  ObjectType,
} from '@/app/types/core';
import { ServerEventType, ServerEvent } from '@/app/types/server-events';
import {
  ClientEventType,
  ClientEvent,
  ConversationItemCreateEvent,
} from '@/app/types/client-events';

type SessionResponse =
  | CreateSessionResponse
  | CreateTranscriptionSessionResponse;

export interface OpenAIRealtimeConfig {
  apiKey: string;
  modelId: string;
  defaultConfig?: Partial<SessionConfig>;
}

export class OpenAIRealtime {
  private eventManager: EventManager;
  private stateManager: StateManager;
  private config: OpenAIRealtimeConfig;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 3;
  private reconnectDelay: number = 1000; // 1 second

  constructor(config: OpenAIRealtimeConfig) {
    this.eventManager = new EventManager();
    this.stateManager = new StateManager();
    this.config = config;
  }

  // Session Management
  async createSession(config: SessionConfig): Promise<SessionResponse> {
    try {
      // TODO: Replace with actual API endpoint
      const response = await fetch('/api/realtime/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.modelId,
          ...config,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create session: ${response.statusText}`);
      }

      const session = (await response.json()) as SessionResponse;
      this.stateManager.setSession(session);
      return session;
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  }

  async connect(session: SessionResponse): Promise<void> {
    try {
      if (!session.client_secret?.value) {
        throw new Error(
          'Session client secret is required for WebRTC connection'
        );
      }

      // Create WebRTC peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      // Set up data channel
      const dataChannel = peerConnection.createDataChannel('openai-realtime', {
        ordered: true,
      });

      // Store connections in state
      this.stateManager.setPeerConnection(peerConnection);
      this.stateManager.setDataChannel(dataChannel);

      // Set up event handlers
      this.setupWebRTCEventHandlers(peerConnection, dataChannel);

      // Create and set local description
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Send offer to OpenAI's signaling server
      const response = await fetch('/api/realtime/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp',
          Authorization: `Bearer ${session.client_secret.value}`,
        },
        body: offer.sdp,
      });

      if (!response.ok) {
        throw new Error(`Failed to connect: ${response.statusText}`);
      }

      const answerSdp = await response.text();
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription({
          type: 'answer',
          sdp: answerSdp,
        })
      );

      console.log('WebRTC connection established');
    } catch (error) {
      console.error('Failed to connect:', error);
      throw error;
    }
  }

  private setupWebRTCEventHandlers(
    peerConnection: RTCPeerConnection,
    dataChannel: RTCDataChannel
  ): void {
    // Handle data channel events
    dataChannel.onopen = () => {
      console.log('Data channel opened');
      this.reconnectAttempts = 0;
    };

    dataChannel.onclose = () => {
      console.log('Data channel closed');
      this.handleDisconnection();
    };

    dataChannel.onmessage = (event) => {
      try {
        const serverEvent = JSON.parse(event.data) as ServerEvent;
        this.eventManager.handleServerEvent(serverEvent);
      } catch (error) {
        console.error('Error parsing server event:', error);
      }
    };

    // Handle peer connection events
    peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', peerConnection.iceConnectionState);
      if (peerConnection.iceConnectionState === 'disconnected') {
        this.handleDisconnection();
      }
    };

    peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'failed') {
        this.handleDisconnection();
      }
    };
  }

  private async handleDisconnection(): Promise<void> {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.disconnect();
      return;
    }

    this.reconnectAttempts++;
    console.log(
      `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    // Wait before attempting to reconnect
    await new Promise((resolve) =>
      setTimeout(resolve, this.reconnectDelay * this.reconnectAttempts)
    );

    // Attempt to reconnect
    const session = this.stateManager.getSession();
    if (session) {
      try {
        await this.connect(session);
      } catch (error) {
        console.error('Reconnection failed:', error);
        this.handleDisconnection();
      }
    }
  }

  disconnect(): void {
    try {
      const peerConnection = this.stateManager.getPeerConnection();
      const dataChannel = this.stateManager.getDataChannel();
      const mediaStream = this.stateManager.getMediaStream();

      // Close WebRTC connections
      dataChannel?.close();
      peerConnection?.close();

      // Stop all media tracks
      mediaStream?.getTracks().forEach((track) => track.stop());

      // Reset state
      this.stateManager.setDataChannel(null);
      this.stateManager.setPeerConnection(null);
      this.stateManager.setMediaStream(null);
      this.stateManager.setSession(null);
      this.reconnectAttempts = 0;
    } catch (error) {
      console.error('Error during disconnect:', error);
      throw error;
    }
  }

  // Audio Management
  async startAudio(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.stateManager.setMediaStream(stream);

      const peerConnection = this.stateManager.getPeerConnection();
      if (!peerConnection) {
        throw new Error('No active WebRTC connection');
      }

      // Add audio track to peer connection
      stream.getAudioTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      console.log('Audio started and added to WebRTC connection');
    } catch (error) {
      console.error('Failed to start audio:', error);
      throw error;
    }
  }

  stopAudio(): void {
    try {
      const mediaStream = this.stateManager.getMediaStream();
      mediaStream?.getTracks().forEach((track) => track.stop());
      this.stateManager.setMediaStream(null);
      console.log('Audio stopped');
    } catch (error) {
      console.error('Error stopping audio:', error);
      throw error;
    }
  }

  // Message Handling
  sendTextMessage(message: string): void {
    const event: ConversationItemCreateEvent = {
      type: ClientEventType.CONVERSATION_ITEM_CREATE,
      item: {
        type: ItemType.MESSAGE,
        role: MessageRole.USER,
        object: ObjectType.ITEM,
        content: [{ type: ContentType.TEXT, text: message }],
      },
    };

    this.sendEvent(event);
  }

  private sendEvent(event: ClientEvent): void {
    const dataChannel = this.stateManager.getDataChannel();
    if (!dataChannel || dataChannel.readyState !== 'open') {
      throw new Error('Data channel not ready');
    }

    dataChannel.send(JSON.stringify(event));
  }

  // Event Handling
  on<T extends ServerEventType>(
    type: T,
    callback: (event: ServerEvent) => void
  ): void {
    this.eventManager.on(type, callback);
  }

  off<T extends ServerEventType>(
    type: T,
    callback: (event: ServerEvent) => void
  ): void {
    this.eventManager.off(type, callback);
  }

  // State Access
  getSession(): SessionResponse | null {
    return this.stateManager.getSession();
  }

  isConnected(): boolean {
    return this.stateManager.isConnected();
  }

  isAudioActive(): boolean {
    return this.stateManager.isAudioActive();
  }
}
