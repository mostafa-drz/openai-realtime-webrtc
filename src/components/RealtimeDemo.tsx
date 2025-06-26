'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { RealtimeClient } from '@/lib/openai-realtime/client/RealtimeClient';
import {
  SessionConfig,
  Voice,
  Modality,
  TurnDetectionType,
  ServerEvent,
  ServerEventType,
} from '@/lib/openai-realtime/types';
import { createRealtimeSession } from '@/lib/actions';
import { VoiceControls } from '@/components/VoiceControls';
import { ConversationPanel } from '@/components/ConversationPanel';
import { SettingsPanel } from '@/components/SettingsPanel';
import { EventLog } from '@/components/EventLog';
import { StatusBar } from '@/components/StatusBar';

// Default session configuration
const defaultSessionConfig: SessionConfig = {
  model: process.env.NEXT_PUBLIC_OPENAI_MODEL,
  voice: Voice.ECHO,
  temperature: 0.8,
  speed: 1.0,
  instructions:
    'You are a helpful AI assistant. Keep responses concise and engaging.',
  modalities: [Modality.AUDIO, Modality.TEXT],
  turn_detection: {
    type: TurnDetectionType.SERVER_VAD,
  },
};

interface EventLogItem {
  id: string;
  type: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

export function RealtimeDemo() {
  const [sessionConfig, setSessionConfig] =
    useState<SessionConfig>(defaultSessionConfig);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [events, setEvents] = useState<EventLogItem[]>([]);
  const [connected, setConnected] = useState(false);
  const [micEnabled, setMicEnabled] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isResponding, setIsResponding] = useState(false);

  const clientRef = useRef<RealtimeClient | null>(null);

  // Add event to log
  const addEvent = useCallback(
    (type: string, data: Record<string, unknown>) => {
      setEvents((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substr(2, 9),
          type,
          data,
          timestamp: new Date(),
        },
      ]);
    },
    []
  );

  // Create client when clientSecret changes
  useEffect(() => {
    if (!clientSecret) {
      clientRef.current = null;
      return;
    }

    if (clientRef.current) {
      clientRef.current.disconnect();
    }

    clientRef.current = new RealtimeClient({
      clientSecret,
      model: sessionConfig.model,
      realtimeUrl: 'https://api.openai.com/v1/realtime',
      onMessageToken: (token) => {
        addEvent(ServerEventType.RESPONSE_TEXT_DELTA, { delta: token });
      },
      onTranscript: (transcript) => {
        addEvent(ServerEventType.RESPONSE_AUDIO_TRANSCRIPT_DELTA, {
          delta: transcript,
        });
      },
      onConnectionStateChange: (state) => {
        setConnected(state === 'connected');
        addEvent('connection_state_change', { state });
      },
      onError: (err) => {
        setError(err);
        addEvent(ServerEventType.ERROR, { error: err.message });
      },
      onConversationItemCreated: (item) => {
        addEvent(ServerEventType.CONVERSATION_ITEM_CREATED, { item });
      },
      onResponseCreated: (response) => {
        setIsResponding(true);
        addEvent(ServerEventType.RESPONSE_CREATED, { response });
      },
      onResponseDone: (response) => {
        setIsResponding(false);
        addEvent(ServerEventType.RESPONSE_DONE, { response });
      },
      onSpeechStarted: () => {
        addEvent(ServerEventType.INPUT_AUDIO_BUFFER_SPEECH_STARTED, {});
      },
      onSpeechStopped: () => {
        addEvent(ServerEventType.INPUT_AUDIO_BUFFER_SPEECH_STOPPED, {});
      },
      onRawEvent: (event: ServerEvent) => {
        addEvent(event.type, {
          event_id: event.event_id,
          data: event,
        });
      },
    });

    // Auto-connect
    const connectClient = async () => {
      try {
        await clientRef.current!.connect();
        addEvent('client_connected', {});
      } catch (err) {
        addEvent(ServerEventType.ERROR, {
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    };
    connectClient();
  }, [clientSecret, sessionConfig.model, addEvent]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (clientRef.current) {
        clientRef.current.disconnect();
      }
    };
  }, []);

  // Handle session creation using server action
  const handleCreateSession = async () => {
    try {
      setIsCreatingSession(true);
      addEvent('session_creating', { config: sessionConfig });

      const result = await createRealtimeSession(sessionConfig);
      console.log('Session created:', result);

      if (result.success && result.clientSecret) {
        setClientSecret(result.clientSecret);
        addEvent(ServerEventType.SESSION_CREATED, {
          sessionId: result.sessionId,
          config: result.config,
        });
      } else {
        addEvent(ServerEventType.ERROR, {
          error: result.error || 'Failed to create session',
        });
      }
    } catch (err) {
      console.error('Session creation error:', err);
      addEvent(ServerEventType.ERROR, {
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setIsCreatingSession(false);
    }
  };

  // Handle session update
  const handleUpdateSession = (newConfig: Partial<SessionConfig>) => {
    try {
      if (clientRef.current) {
        clientRef.current.updateSession(newConfig);
      }
      setSessionConfig((prev) => ({ ...prev, ...newConfig }));
      addEvent(ServerEventType.SESSION_UPDATED, { config: newConfig });
    } catch (err) {
      addEvent(ServerEventType.ERROR, {
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  // Handle voice input toggle
  const handleVoiceToggle = async () => {
    if (!clientRef.current || !connected) return;

    try {
      if (micEnabled) {
        clientRef.current.stopVoiceInput();
        setMicEnabled(false);
        addEvent('voice_stopped', {});
      } else {
        await clientRef.current.startVoiceInput();
        setMicEnabled(true);
        addEvent('voice_started', {});
      }
    } catch (err) {
      addEvent(ServerEventType.ERROR, {
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  // Handle text message sending
  const handleSendTextMessage = async (text: string) => {
    if (!clientRef.current || !connected || !text.trim()) return;

    try {
      await clientRef.current.sendTextMessage(text);
      addEvent('text_message_sent', { text });

      // Automatically request response
      await clientRef.current.requestResponse();
      addEvent('response_requested', {});
    } catch (err) {
      addEvent(ServerEventType.ERROR, {
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  // Handle response cancellation
  const handleCancelResponse = async () => {
    if (!clientRef.current || !connected || !isResponding) return;

    try {
      await clientRef.current.cancelResponse('User cancelled');
      addEvent(ServerEventType.RESPONSE_CANCELLED, {
        reason: 'User cancelled',
      });
    } catch (err) {
      addEvent(ServerEventType.ERROR, {
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  // Handle disconnect
  const handleDisconnect = () => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
    setClientSecret('');
    setConnected(false);
    setMicEnabled(false);
    setError(null);
    addEvent('session_disconnected', {});
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Configuration Section */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Session Management
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Session Creation */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Create New Session
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Click the button below to create a new OpenAI Realtime session
              with your current settings.
            </p>
            <button
              onClick={handleCreateSession}
              disabled={isCreatingSession || connected}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isCreatingSession ? 'Creating Session...' : 'Start New Session'}
            </button>
          </div>

          {/* Connection Controls */}
          <div className="flex items-end gap-3">
            <button
              onClick={handleDisconnect}
              disabled={!connected}
              className="px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              Disconnect
            </button>

            {clientSecret && (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Session: {clientSecret.substring(0, 8)}...
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Demo Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Settings & Controls */}
        <div className="space-y-6">
          <SettingsPanel
            config={sessionConfig}
            onConfigChange={handleUpdateSession}
            disabled={!connected}
          />

          <VoiceControls
            connected={connected}
            micEnabled={micEnabled}
            onVoiceToggle={handleVoiceToggle}
            isResponding={isResponding}
            onCancelResponse={handleCancelResponse}
          />
        </div>

        {/* Center Panel - Conversation */}
        <div className="lg:col-span-2">
          <ConversationPanel
            connected={connected}
            events={events}
            conversationItems={[]} // Simplified for now
            isResponding={isResponding}
            onSendTextMessage={handleSendTextMessage}
          />
        </div>
      </div>

      {/* Bottom Panel - Status & Events */}
      <div className="mt-6 space-y-6">
        <StatusBar
          connected={connected}
          micEnabled={micEnabled}
          error={error}
          isResponding={isResponding}
          conversationItemCount={0} // Simplified for now
        />

        <EventLog events={events} />
      </div>
    </div>
  );
}
