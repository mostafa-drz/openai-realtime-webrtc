import { ClientEventType } from '../types/client-events';
import { SessionConfig, ConnectionState } from '../types/core';

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
}

export class RealtimeClient {
  private config: RealtimeClientConfig;
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private micActive: boolean = false;
  private sessionId?: string;
  private pc?: RTCPeerConnection;
  private dataChannel?: RTCDataChannel;

  constructor(config: RealtimeClientConfig) {
    this.config = config;
  }

  private updateState(state: ConnectionState) {
    this.connectionState = state;
    this.config.onConnectionStateChange?.(state);
  }

  private handleServerEvent(event: any) {
    // Placeholder for handling server events received on data channel
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

      const resp = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/sdp',
          Authorization: `Bearer ${this.config.clientSecret}`,
        },
        body: offer.sdp,
      });

      if (!resp.ok) throw new Error(`SDP request failed: ${resp.status}`);

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
}
