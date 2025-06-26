import { useEffect, useRef, useState } from 'react';
import {
  RealtimeClient,
  RealtimeClientConfig,
  ConversationState,
} from './client/RealtimeClient';
import {
  SessionConfig,
  Item,
  Response,
  ServerEvent,
  ResponseConfig,
  MessageRole,
} from './types';

export interface UseRealtimeClientConfig extends RealtimeClientConfig {
  onConversationItemCreated?: (item: Item) => void;
  onResponseCreated?: (response: Response) => void;
  onResponseDone?: (response: Response) => void;
  onSpeechStarted?: () => void;
  onSpeechStopped?: () => void;
  onRawEvent?: (event: ServerEvent) => void;
}

export function useRealtimeClient(config: UseRealtimeClientConfig) {
  const clientRef = useRef<RealtimeClient | null>(null);
  const [connected, setConnected] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [conversationState, setConversationState] = useState<ConversationState>(
    {
      items: [],
      currentResponseId: undefined,
      isResponding: false,
    }
  );

  if (!clientRef.current) {
    clientRef.current = new RealtimeClient({
      ...config,
      onMessageToken: (token) => config.onMessageToken?.(token),
      onTranscript: (transcript) => config.onTranscript?.(transcript),
      onError: (err) => {
        setError(err);
        config.onError?.(err);
      },
      onConversationItemCreated: (item) => {
        setConversationState((prev) => ({
          ...prev,
          items: [...prev.items, item],
        }));
        config.onConversationItemCreated?.(item);
      },
      onResponseCreated: (response) => {
        setConversationState((prev) => ({
          ...prev,
          currentResponseId: response.id,
          isResponding: true,
        }));
        config.onResponseCreated?.(response);
      },
      onResponseDone: (response) => {
        setConversationState((prev) => ({
          ...prev,
          isResponding: false,
        }));
        config.onResponseDone?.(response);
      },
      onSpeechStarted: () => {
        config.onSpeechStarted?.();
      },
      onSpeechStopped: () => {
        config.onSpeechStopped?.();
      },
      onRawEvent: (event) => {
        config.onRawEvent?.(event);
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

  // High-level conversation methods
  const sendTextMessage = async (text: string, role?: MessageRole) => {
    if (!clientRef.current) return;
    await clientRef.current.sendTextMessage(text, role);
  };

  const requestResponse = async (options?: Partial<ResponseConfig>) => {
    if (!clientRef.current) return;
    await clientRef.current.requestResponse(options);
  };

  const cancelResponse = async (reason?: string) => {
    if (!clientRef.current) return;
    await clientRef.current.cancelResponse(reason);
  };

  const commitAudioBuffer = async () => {
    if (!clientRef.current) return;
    await clientRef.current.commitAudioBuffer();
  };

  const clearAudioBuffer = async () => {
    if (!clientRef.current) return;
    await clientRef.current.clearAudioBuffer();
  };

  const clearOutputAudioBuffer = async () => {
    if (!clientRef.current) return;
    await clientRef.current.clearOutputAudioBuffer();
  };

  return {
    client: clientRef.current,
    connect,
    disconnect,
    startVoiceInput,
    stopVoiceInput,
    updateSession,
    // High-level conversation methods
    sendTextMessage,
    requestResponse,
    cancelResponse,
    commitAudioBuffer,
    clearAudioBuffer,
    clearOutputAudioBuffer,
    // State
    connected,
    micEnabled,
    error,
    conversationState,
    conversationItems: conversationState.items,
    isResponding: conversationState.isResponding,
    currentResponseId: conversationState.currentResponseId,
  };
}
