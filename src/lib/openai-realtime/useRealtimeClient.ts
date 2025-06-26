import { useEffect, useRef, useState, useCallback } from 'react';
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
  autoConnect?: boolean;
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

  const prevClientSecretRef = useRef<string>('');

  const createClient = useCallback(() => {
    if (!config.clientSecret) {
      clientRef.current = null;
      return;
    }

    if (prevClientSecretRef.current !== config.clientSecret) {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }

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

      prevClientSecretRef.current = config.clientSecret;
    }
  }, [config]);

  useEffect(() => {
    createClient();

    if (
      config.autoConnect &&
      config.clientSecret &&
      clientRef.current &&
      !connected
    ) {
      const connectClient = async () => {
        try {
          await clientRef.current!.connect();
          setConnected(true);
        } catch (err) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      };
      connectClient();
    }
  }, [config.clientSecret, config.autoConnect, createClient, connected]);

  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
        clientRef.current = null;
      }
    };
  }, []);

  const connect = useCallback(async () => {
    if (!clientRef.current) {
      throw new Error(
        'No client available. Please ensure clientSecret is provided.'
      );
    }

    try {
      await clientRef.current.connect();
      setConnected(true);
      setError(null);
    } catch (err) {
      setConnected(false);
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }, []);

  const disconnect = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
    setConnected(false);
    setMicEnabled(false);
    setError(null);
  }, []);

  const startVoiceInput = useCallback(async () => {
    if (!clientRef.current) {
      throw new Error(
        'No client available. Please ensure clientSecret is provided.'
      );
    }

    await clientRef.current.startVoiceInput();
    setMicEnabled(true);
  }, []);

  const stopVoiceInput = useCallback(() => {
    if (clientRef.current) {
      clientRef.current.stopVoiceInput();
    }
    setMicEnabled(false);
  }, []);

  const updateSession = useCallback((session: Partial<SessionConfig>) => {
    if (!clientRef.current) {
      throw new Error(
        'No client available. Please ensure clientSecret is provided.'
      );
    }

    clientRef.current.updateSession(session);
  }, []);

  const sendTextMessage = useCallback(
    async (text: string, role?: MessageRole) => {
      if (!clientRef.current) {
        throw new Error(
          'No client available. Please ensure clientSecret is provided.'
        );
      }

      await clientRef.current.sendTextMessage(text, role);
    },
    []
  );

  const requestResponse = useCallback(
    async (options?: Partial<ResponseConfig>) => {
      if (!clientRef.current) {
        throw new Error(
          'No client available. Please ensure clientSecret is provided.'
        );
      }

      await clientRef.current.requestResponse(options);
    },
    []
  );

  const cancelResponse = useCallback(async (reason?: string) => {
    if (!clientRef.current) {
      throw new Error(
        'No client available. Please ensure clientSecret is provided.'
      );
    }

    await clientRef.current.cancelResponse(reason);
  }, []);

  const commitAudioBuffer = useCallback(async () => {
    if (!clientRef.current) {
      throw new Error(
        'No client available. Please ensure clientSecret is provided.'
      );
    }

    await clientRef.current.commitAudioBuffer();
  }, []);

  const clearAudioBuffer = useCallback(async () => {
    if (!clientRef.current) {
      throw new Error(
        'No client available. Please ensure clientSecret is provided.'
      );
    }

    await clientRef.current.clearAudioBuffer();
  }, []);

  const clearOutputAudioBuffer = useCallback(async () => {
    if (!clientRef.current) {
      throw new Error(
        'No client available. Please ensure clientSecret is provided.'
      );
    }

    await clientRef.current.clearOutputAudioBuffer();
  }, []);

  return {
    client: clientRef.current,
    connect,
    disconnect,
    startVoiceInput,
    stopVoiceInput,
    updateSession,
    sendTextMessage,
    requestResponse,
    cancelResponse,
    commitAudioBuffer,
    clearAudioBuffer,
    clearOutputAudioBuffer,
    connected,
    micEnabled,
    error,
    conversationState,
    conversationItems: conversationState.items,
    isResponding: conversationState.isResponding,
    currentResponseId: conversationState.currentResponseId,
    hasClient: !!clientRef.current,
  };
}
