import {
  SessionConfig,
  CreateSessionResponse,
  CreateTranscriptionSessionResponse,
} from '@/app/types/core';

type SessionResponse =
  | CreateSessionResponse
  | CreateTranscriptionSessionResponse;

export class StateManager {
  private session: SessionResponse | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private mediaStream: MediaStream | null = null;
  private config: SessionConfig | null = null;

  getSession(): SessionResponse | null {
    return this.session;
  }

  setSession(session: SessionResponse | null): void {
    this.session = session;
  }

  getPeerConnection(): RTCPeerConnection | null {
    return this.peerConnection;
  }

  setPeerConnection(connection: RTCPeerConnection | null): void {
    this.peerConnection = connection;
  }

  getDataChannel(): RTCDataChannel | null {
    return this.dataChannel;
  }

  setDataChannel(channel: RTCDataChannel | null): void {
    this.dataChannel = channel;
  }

  getMediaStream(): MediaStream | null {
    return this.mediaStream;
  }

  setMediaStream(stream: MediaStream | null): void {
    this.mediaStream = stream;
  }

  getConfig(): SessionConfig | null {
    return this.config;
  }

  setConfig(config: SessionConfig | null): void {
    this.config = config;
  }

  isConnected(): boolean {
    return (
      this.session !== null &&
      this.peerConnection?.connectionState === 'connected' &&
      this.dataChannel?.readyState === 'open'
    );
  }

  isAudioActive(): boolean {
    return (
      this.mediaStream !== null &&
      this.mediaStream.getAudioTracks().some((track) => track.enabled)
    );
  }
}
