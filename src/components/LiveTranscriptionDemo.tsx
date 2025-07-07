'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { RealtimeClient } from '@/lib/openai-realtime/client/RealtimeClient';
import {
  TranscriptionSessionConfig,
  TranscriptionModel,
  TurnDetectionType,
  ServerEvent,
  ServerEventType,
  AudioFormat,
} from '@/lib/openai-realtime/types';
import { createRealtimeTranscriptionSession } from '@/lib/actions';
import { EventLog } from '@/components/EventLog';
import { StatusBar } from '@/components/StatusBar';

// Default configuration for live transcription sessions
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

export function LiveTranscriptionDemo() {
  const [transcriptionConfig] = useState<TranscriptionSessionConfig>(
    defaultTranscriptionConfig
  );
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [events, setEvents] = useState<EventLogItem[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');
  const [transcriptionHistory, setTranscriptionHistory] = useState<
    Array<{
      id: string;
      text: string;
      timestamp: Date;
    }>
  >([]);

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
      realtimeUrl:
        process.env.NEXT_PUBLIC_OPENAI_REALTIME_WEBRTC_URL ||
        'https://api.openai.com/v1/realtime',
      sessionType: 'transcription',
      // Speaker-specific transcript callbacks
      onUserTranscriptDelta: (text: string) => {
        setCurrentTranscript(text);
        addEvent('user_transcript_delta', { text });
      },
      onUserTranscriptDone: (text: string) => {
        setCurrentTranscript(''); // Clear live transcript
        setTranscriptionHistory((prev) => [
          ...prev,
          {
            id: `transcript-${Date.now()}`,
            text,
            timestamp: new Date(),
          },
        ]);
        addEvent('user_transcript_done', { text });
      },
      onTranscriptionError: (error: Error) => {
        addEvent('transcription_error', { error: error.message });
      },
      onConnectionStateChange: (state) => {
        setConnected(state === 'connected');
        addEvent('connection_state_change', { state });
      },
      onError: (err) => {
        setError(err);
        addEvent(ServerEventType.ERROR, { error: err.message });
      },
      // Raw event access for debugging
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
  }, [clientSecret, addEvent]);

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
      setError(null);

      addEvent('session_creating', {
        config: transcriptionConfig,
        type: 'transcription',
      });

      const result =
        await createRealtimeTranscriptionSession(transcriptionConfig);

      if (result.success && result.clientSecret) {
        setClientSecret(result.clientSecret);
        addEvent(ServerEventType.SESSION_CREATED, {
          sessionId: result.sessionId,
          config: result.config,
          sessionType: 'transcription',
        });
      } else {
        throw new Error(result.error || 'Failed to create session');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      addEvent(ServerEventType.ERROR, { error: error.message });
    } finally {
      setIsCreatingSession(false);
    }
  };

  const handleDisconnect = () => {
    if (clientRef.current) {
      clientRef.current.disconnect();
    }
    setClientSecret('');
    setConnected(false);
    setError(null);
    addEvent('client_disconnected', {});
  };

  const handleClearHistory = () => {
    setTranscriptionHistory([]);
    setCurrentTranscript('');
    addEvent('history_cleared', {});
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Session Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Session Controls
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Create a live transcription session to start transcribing your
              voice in real-time
            </p>
          </div>

          <div className="flex gap-3">
            {!connected ? (
              <button
                onClick={handleCreateSession}
                disabled={isCreatingSession}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isCreatingSession ? 'Creating...' : 'Start Live Transcription'}
              </button>
            ) : (
              <button
                onClick={handleDisconnect}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Stop Transcription
              </button>
            )}

            {transcriptionHistory.length > 0 && (
              <button
                onClick={handleClearHistory}
                className="px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
              >
                Clear History
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar
        connected={connected}
        micEnabled={false}
        error={error}
        transcriptionEnabled={true}
      />

      {/* Live Transcript Display */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Live Transcription
        </h3>

        {/* Current transcript */}
        {currentTranscript && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Speaking...
              </span>
            </div>
            <p className="text-slate-900 dark:text-slate-100">
              {currentTranscript}
            </p>
          </div>
        )}

        {/* Transcription history */}
        {transcriptionHistory.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-slate-700 dark:text-slate-300 mb-3">
              Transcription History
            </h4>
            <div className="space-y-3">
              {transcriptionHistory.map((item) => (
                <div
                  key={item.id}
                  className="p-3 bg-slate-50 dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600"
                >
                  <p className="text-slate-900 dark:text-slate-100">
                    {item.text}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {item.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {!currentTranscript && transcriptionHistory.length === 0 && (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <div className="text-4xl mb-4">🎤</div>
            <p>Start speaking to see your words appear here</p>
          </div>
        )}
      </div>

      {/* Event Log */}
      <EventLog events={events} />
    </div>
  );
}
