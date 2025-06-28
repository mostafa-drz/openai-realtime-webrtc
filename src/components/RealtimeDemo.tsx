'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { RealtimeClient } from '@/lib/openai-realtime/client/RealtimeClient';
import {
  SessionConfig,
  TranscriptionSessionConfig,
  Voice,
  Modality,
  TurnDetectionType,
  ServerEvent,
  ServerEventType,
  TranscriptionModel,
  Item,
  ContentType,
  AudioFormat,
} from '@/lib/openai-realtime/types';
import {
  createRealtimeSession,
  createRealtimeTranscriptionSession,
} from '@/lib/actions';
import { ConversationPanel } from '@/components/ConversationPanel';
import { TranscriptionPanel } from '@/components/TranscriptionPanel';
import { SettingsPanel } from '@/components/SettingsPanel';
import { EventLog } from '@/components/EventLog';
import { StatusBar } from '@/components/StatusBar';

// Default session configuration for regular sessions
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
  // Enable transcription by default
  input_audio_transcription: {
    model: TranscriptionModel.GPT4O_TRANSCRIBE,
    language: 'en',
  },
};

// Default configuration for transcription sessions
const defaultTranscriptionConfig: TranscriptionSessionConfig = {
  turn_detection: {
    type: TurnDetectionType.SERVER_VAD,
  },
  input_audio_transcription: {
    model: TranscriptionModel.GPT4O_TRANSCRIBE,
    language: 'en',
  },
  input_audio_format: AudioFormat.PCM16,
};

interface EventLogItem {
  id: string;
  type: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

// Type guards for content blocks
function isAudioContent(
  content: unknown
): content is { type: 'audio'; transcript?: string } {
  return (
    typeof content === 'object' &&
    content !== null &&
    'type' in content &&
    (content as { type?: unknown }).type === 'audio' &&
    'transcript' in content &&
    typeof (content as { transcript?: unknown }).transcript === 'string'
  );
}
function isTextContent(
  content: unknown
): content is { type: 'text'; text?: string } {
  return (
    typeof content === 'object' &&
    content !== null &&
    'type' in content &&
    (content as { type?: unknown }).type === 'text' &&
    'text' in content &&
    typeof (content as { text?: unknown }).text === 'string'
  );
}

export function RealtimeDemo() {
  const [sessionConfig, setSessionConfig] =
    useState<SessionConfig>(defaultSessionConfig);
  const [transcriptionConfig, setTranscriptionConfig] =
    useState<TranscriptionSessionConfig>(defaultTranscriptionConfig);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [events, setEvents] = useState<EventLogItem[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isResponding, setIsResponding] = useState(false);
  const [conversationItems, setConversationItems] = useState<Item[]>([]);
  const [micActive, setMicActive] = useState(false);
  const [sessionType, setSessionType] = useState<'regular' | 'transcription'>(
    'regular'
  );

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
      sessionType,
      // Event log for debugging
      onRawEvent: (event: ServerEvent) => {
        addEvent(event.type, {
          event_id: event.event_id,
          data: event,
        });
        // Only manage state here, not chat thread
        switch (event.type) {
          case 'input_audio_buffer.speech_started':
            setMicActive(true);
            break;
          case 'input_audio_buffer.speech_stopped':
            setMicActive(false);
            // Auto-commit audio for transcription
            clientRef.current?.commitAudioBuffer();
            break;
          case ServerEventType.SESSION_CREATED:
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
      // Use high-level API for chat thread
      onConversationItemCreated: (item) => {
        if (
          item.type === 'message' &&
          'role' in item &&
          'content' in item &&
          item.role === 'user'
        ) {
          // Only add if there is a valid text content
          const textContent = item.content.find(
            (c) =>
              isTextContent(c) ||
              (c.type === 'input_text' &&
                typeof (c as { text?: unknown }).text === 'string')
          );
          let contentBlock: { type: ContentType.TEXT; text: string } | null =
            null;
          if (textContent && isTextContent(textContent)) {
            const tc = textContent as {
              type: ContentType.TEXT;
              text: string;
            };

            contentBlock = { type: ContentType.TEXT, text: tc.text };
          } else if (
            textContent &&
            textContent.type === 'input_text' &&
            typeof (textContent as { text?: unknown }).text === 'string'
          ) {
            contentBlock = {
              type: ContentType.TEXT,
              text: (textContent as { text: string }).text,
            };
          }
          if (contentBlock) {
            setConversationItems((prev) => [
              ...prev,
              { ...item, content: [contentBlock] },
            ]);
          }
        }
      },
      onResponseDone: (response) => {
        response.output.forEach((item) => {
          if (
            item.type === 'message' &&
            'role' in item &&
            'content' in item &&
            item.role === 'assistant'
          ) {
            // Extract only the first transcript or text
            const transcriptContent = item.content.find(isAudioContent);
            const textContent = item.content.find(isTextContent);
            let contentBlock: { type: ContentType.TEXT; text: string } | null =
              null;
            if (transcriptContent && isAudioContent(transcriptContent)) {
              const tc = transcriptContent as {
                type: 'audio';
                transcript: string;
              };

              contentBlock = {
                type: ContentType.TEXT,
                text: tc.transcript,
              };
            } else if (textContent && isTextContent(textContent)) {
              const tc = textContent as {
                type: ContentType.TEXT;
                text: string;
              };

              contentBlock = {
                type: ContentType.TEXT,
                text: tc.text,
              };
            }
            if (contentBlock) {
              setConversationItems((prev) => [
                ...prev,
                { ...item, content: [contentBlock] },
              ]);
            }
          }
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
  }, [clientSecret, sessionConfig.model, addEvent, sessionType]);

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

      let result;

      if (sessionType === 'regular') {
        addEvent('session_creating', {
          config: sessionConfig,
          type: 'regular',
        });
        result = await createRealtimeSession(sessionConfig);
      } else {
        addEvent('session_creating', {
          config: transcriptionConfig,
          type: 'transcription',
        });
        result = await createRealtimeTranscriptionSession(transcriptionConfig);
      }

      if (result.success && result.clientSecret) {
        setClientSecret(result.clientSecret);
        addEvent(ServerEventType.SESSION_CREATED, {
          sessionId: result.sessionId,
          config: result.config,
          sessionType,
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
  const handleUpdateSession = (
    newConfig: Partial<SessionConfig> | Partial<TranscriptionSessionConfig>
  ) => {
    try {
      // Always update local config state based on session type
      if (sessionType === 'regular') {
        setSessionConfig((prev) => ({
          ...prev,
          ...(newConfig as Partial<SessionConfig>),
        }));
      } else {
        setTranscriptionConfig((prev) => ({
          ...prev,
          ...(newConfig as Partial<TranscriptionSessionConfig>),
        }));
      }

      // Only send update to server if connected
      if (clientRef.current && connected) {
        if (sessionType === 'regular') {
          clientRef.current.updateSession(newConfig as Partial<SessionConfig>);
        } else {
          clientRef.current.updateTranscriptionSession(
            newConfig as Partial<TranscriptionSessionConfig>
          );
        }
        addEvent(ServerEventType.SESSION_UPDATED, {
          config: newConfig,
          sessionType,
        });
      } else {
        // Log config change when not connected (pre-session configuration)
        addEvent('config_updated', { config: newConfig, sessionType });
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

    // Don't send text messages for transcription sessions
    if (sessionType === 'transcription') {
      addEvent('text_message_blocked', {
        reason: 'Text messages not supported in transcription sessions',
        text,
      });
      return;
    }

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
      {/* 0. Status Bar */}
      <StatusBar
        connected={connected}
        micEnabled={micActive}
        error={error}
        isResponding={isResponding}
        conversationItemCount={conversationItems.length}
        transcriptionEnabled={
          sessionType === 'regular'
            ? sessionConfig.input_audio_transcription !== null
            : transcriptionConfig.input_audio_transcription !== null
        }
        onDisconnect={handleDisconnect}
      />

      {/* 1. Session Management */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Session Management
        </h2>

        <div className="space-y-4">
          {/* Session Type Selector */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Session Type
            </label>
            <select
              value={sessionType}
              onChange={(e) =>
                setSessionType(e.target.value as 'regular' | 'transcription')
              }
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 mb-3"
              disabled={connected}
            >
              <option value="regular">Regular Chat Session</option>
              <option value="transcription">Transcription Session</option>
            </select>
          </div>
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
                  config={
                    sessionType === 'regular'
                      ? sessionConfig
                      : transcriptionConfig
                  }
                  onConfigChange={handleUpdateSession}
                  disabled={connected}
                  sessionType={sessionType}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Conversation Panel or Transcription Panel */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        {sessionType === 'regular' ? (
          <ConversationPanel
            connected={connected}
            events={events}
            conversationItems={conversationItems}
            isResponding={isResponding}
            modalities={sessionConfig.modalities}
            onSendTextMessage={handleSendTextMessage}
            sessionType={sessionType}
          />
        ) : (
          <TranscriptionPanel connected={connected} events={events} />
        )}
      </div>

      {/* 4. Event Log */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <EventLog events={events} />
      </div>
    </div>
  );
}
