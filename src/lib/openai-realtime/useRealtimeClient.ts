import { useEffect, useRef, useState } from 'react';
import { RealtimeClient, RealtimeClientConfig } from './client/RealtimeClient';
import { SessionConfig } from './types';

export function useRealtimeClient(config: RealtimeClientConfig) {
  const clientRef = useRef<RealtimeClient | null>(null);
  const [connected, setConnected] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  if (!clientRef.current) {
    clientRef.current = new RealtimeClient({
      ...config,
      onMessageToken: (token) => config.onMessageToken?.(token),
      onTranscript: (transcript) => config.onTranscript?.(transcript),
      onError: (err) => {
        setError(err);
        config.onError?.(err);
      },
    });
  }

  useEffect(() => {
    return () => {
      clientRef.current?.disconnect();
      clientRef.current = null;
    };
  }, []);

  const connect = async () => {
    if (!clientRef.current) return;
    await clientRef.current.connect();
    setConnected(true);
  };

  const disconnect = () => {
    clientRef.current?.disconnect();
    setConnected(false);
    setMicEnabled(false);
  };

  const startVoiceInput = async () => {
    if (!clientRef.current) return;
    await clientRef.current.startVoiceInput();
    setMicEnabled(true);
  };

  const stopVoiceInput = () => {
    clientRef.current?.stopVoiceInput();
    setMicEnabled(false);
  };

  const updateSession = (session: Partial<SessionConfig>) => {
    clientRef.current?.updateSession(session);
  };

  return {
    client: clientRef.current,
    connect,
    disconnect,
    startVoiceInput,
    stopVoiceInput,
    updateSession,
    connected,
    micEnabled,
    error,
  };
}
