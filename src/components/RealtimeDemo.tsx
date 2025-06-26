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
import { ConversationPanel } from '@/components/ConversationPanel';
import { SettingsPanel } from '@/components/SettingsPanel';
import { EventLog } from '@/components/EventLog';

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
  const [error, setError] = useState<Error | null>(null);
  const [isResponding, setIsResponding] = useState(false);

  const clientRef = useRef<RealtimeClient | null>(null);

  // Collapsible state for session settings
  const [settingsOpen, setSettingsOpen] = useState(false);

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
      realtimeUrl:
        process.env.NEXT_PUBLIC_OPENAI_REALTIME_WEBRTC_URL ||
        'https://api.openai.com/v1/realtime',
      // Raw event access for comprehensive logging and state management
      onRawEvent: (event: ServerEvent) => {
        addEvent(event.type, {
          event_id: event.event_id,
          data: event,
        });

        // Manage state based on event types
        switch (event.type) {
          case ServerEventType.SESSION_CREATED:
            // Session created successfully
            break;
          case ServerEventType.RESPONSE_CREATED:
            setIsResponding(true);
            break;
          case ServerEventType.RESPONSE_DONE:
            setIsResponding(false);
            break;
          case ServerEventType.ERROR:
            setError(new Error(event.error?.message || 'Unknown error'));
            break;
        }
      },
      // Connection state management
      onConnectionStateChange: (state) => {
        setConnected(state === 'connected');
        addEvent('connection_state_change', { state });
      },
      // Error handling
      onError: (err) => {
        setError(err);
        addEvent(ServerEventType.ERROR, { error: err.message });
      },
      // Placeholder callbacks for future use:
      // onMessageToken: (token) => { /* Handle text tokens */ },
      // onTranscript: (transcript) => { /* Handle speech transcript */ },
      // onConversationItemCreated: (item) => { /* Handle new conversation items */ },
      // onSpeechStarted: () => { /* Handle speech detection start */ },
      // onSpeechStopped: () => { /* Handle speech detection end */ },
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
      setError(null); // Clear any previous errors
      addEvent('session_creating', { config: sessionConfig });

      const result = await createRealtimeSession(sessionConfig);

      if (result.success && result.clientSecret) {
        setClientSecret(result.clientSecret);
        addEvent(ServerEventType.SESSION_CREATED, {
          sessionId: result.sessionId,
          config: result.config,
        });

        // Automatically start recording after successful session creation
        try {
          if (clientRef.current) {
            await clientRef.current.startVoiceInput();
            addEvent('voice_started', {});
          }
        } catch (voiceErr) {
          addEvent(ServerEventType.ERROR, {
            error: `Session created but failed to start recording: ${voiceErr instanceof Error ? voiceErr.message : 'Unknown error'}`,
          });
        }
      } else {
        setError(new Error(result.error || 'Failed to create session'));
        addEvent(ServerEventType.ERROR, {
          error: result.error || 'Failed to create session',
        });
      }
    } catch (err) {
      console.error('Session creation error:', err);
      setError(err instanceof Error ? err : new Error(String(err)));
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
      // Always update local config state
      setSessionConfig((prev) => ({ ...prev, ...newConfig }));

      // Only send update to server if connected
      if (clientRef.current && connected) {
        clientRef.current.updateSession(newConfig);
        addEvent(ServerEventType.SESSION_UPDATED, { config: newConfig });
      } else {
        // Log config change when not connected (pre-session configuration)
        addEvent('config_updated', { config: newConfig });
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

  // Handle disconnect
  const handleDisconnect = () => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
    setClientSecret('');
    setConnected(false);
    setError(null);
    addEvent('session_disconnected', {});
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 1. Connection State */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                connected ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
            {clientSecret && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Session: {clientSecret.substring(0, 8)}...
              </span>
            )}
          </div>
          {connected && (
            <button
              onClick={handleDisconnect}
              className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Disconnect
            </button>
          )}
        </div>
        {error && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-700 dark:text-red-300">
              Error: {error.message}
            </p>
          </div>
        )}
      </div>

      {/* 2. Session Management */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Session Management
        </h2>

        <div className="space-y-4">
          {/* Session Creation */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Start Session & Recording
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Click the button below to create a new OpenAI Realtime session
              with your current settings and automatically start recording.
            </p>
            <button
              onClick={handleCreateSession}
              disabled={isCreatingSession || connected}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isCreatingSession
                ? 'Starting Session...'
                : 'Start Session & Recording'}
            </button>
          </div>

          {/* Collapsible Session Settings */}
          <div>
            <button
              onClick={() => setSettingsOpen((open) => !open)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-100 dark:bg-slate-700 rounded-md font-medium text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              aria-expanded={settingsOpen}
              aria-controls="session-settings-panel"
            >
              <span>Session Settings</span>
              <svg
                className={`w-5 h-5 ml-2 transition-transform ${settingsOpen ? 'rotate-90' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            {settingsOpen && (
              <div id="session-settings-panel" className="mt-4">
                <SettingsPanel
                  config={sessionConfig}
                  onConfigChange={handleUpdateSession}
                  disabled={connected}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Conversation Panel */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <ConversationPanel
          connected={connected}
          events={events}
          conversationItems={[]} // Simplified for now
          isResponding={isResponding}
          modalities={sessionConfig.modalities}
          onSendTextMessage={handleSendTextMessage}
        />
      </div>

      {/* 4. Event Log */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <EventLog events={events} />
      </div>
    </div>
  );
}
