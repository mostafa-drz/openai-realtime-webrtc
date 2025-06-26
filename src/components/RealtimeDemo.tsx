'use client';

import { useState, useCallback } from 'react';
import { useRealtimeClient } from '@/lib/openai-realtime/useRealtimeClient';
import {
  SessionConfig,
  Voice,
  Modality,
  TurnDetectionType,
  ServerEvent,
  ServerEventType,
  Item,
  Response,
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

  // Initialize the realtime client with enhanced features
  const {
    disconnect,
    startVoiceInput,
    stopVoiceInput,
    updateSession,
    // High-level conversation methods
    sendTextMessage,
    requestResponse,
    cancelResponse,
    // Enhanced state
    connected,
    micEnabled,
    error,
    conversationItems,
    isResponding,
  } = useRealtimeClient({
    clientSecret,
    model: sessionConfig.model,
    realtimeUrl: 'https://api.openai.com/v1/realtime',
    autoConnect: true, // Enable auto-connection when clientSecret is available
    onMessageToken: (token) => {
      addEvent(ServerEventType.RESPONSE_TEXT_DELTA, { delta: token });
    },
    onTranscript: (transcript) => {
      addEvent(ServerEventType.RESPONSE_AUDIO_TRANSCRIPT_DELTA, {
        delta: transcript,
      });
    },
    onConnectionStateChange: (state) => {
      addEvent('connection_state_change', { state });
    },
    onError: (err) => {
      addEvent(ServerEventType.ERROR, { error: err.message });
    },
    // New high-level callbacks
    onConversationItemCreated: (item: Item) => {
      addEvent(ServerEventType.CONVERSATION_ITEM_CREATED, { item });
    },
    onResponseCreated: (response: Response) => {
      addEvent(ServerEventType.RESPONSE_CREATED, { response });
    },
    onResponseDone: (response: Response) => {
      addEvent(ServerEventType.RESPONSE_DONE, { response });
    },
    onSpeechStarted: () => {
      addEvent(ServerEventType.INPUT_AUDIO_BUFFER_SPEECH_STARTED, {});
    },
    onSpeechStopped: () => {
      addEvent(ServerEventType.INPUT_AUDIO_BUFFER_SPEECH_STOPPED, {});
    },
    // Raw event access for advanced logging
    onRawEvent: (event: ServerEvent) => {
      addEvent(event.type, {
        event_id: event.event_id,
        data: event,
      });
    },
  });

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

        // The hook will automatically connect when clientSecret changes
        // No need to manually call connect() anymore
        addEvent('session_connected', { sessionId: result.sessionId });
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
      updateSession(newConfig);
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
    if (!connected) return;

    try {
      if (micEnabled) {
        stopVoiceInput();
        addEvent('voice_stopped', {});
      } else {
        await startVoiceInput();
        addEvent('voice_started', {});
      }
    } catch (err) {
      addEvent(ServerEventType.ERROR, {
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  // Handle text message sending (new feature)
  const handleSendTextMessage = async (text: string) => {
    if (!connected || !text.trim()) return;

    try {
      await sendTextMessage(text);
      addEvent('text_message_sent', { text });

      // Automatically request response
      await requestResponse();
      addEvent('response_requested', {});
    } catch (err) {
      addEvent(ServerEventType.ERROR, {
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  // Handle response cancellation (new feature)
  const handleCancelResponse = async () => {
    if (!connected || !isResponding) return;

    try {
      await cancelResponse('User cancelled');
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
    disconnect();
    setClientSecret(''); // Clear clientSecret to trigger hook cleanup
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
            conversationItems={conversationItems}
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
          conversationItemCount={conversationItems.length}
        />

        <EventLog events={events} />
      </div>
    </div>
  );
}
