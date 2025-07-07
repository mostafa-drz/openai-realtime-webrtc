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
import { AudioInputPanel } from '@/components/AudioInputPanel';

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

interface CurrentTranscription {
  filename: string;
  transcript: string;
  status: 'idle' | 'processing' | 'completed' | 'error';
  error?: string;
}

export function VoiceTranscriptionDemo() {
  const [transcriptionConfig] = useState<TranscriptionSessionConfig>(
    defaultTranscriptionConfig
  );
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [events, setEvents] = useState<EventLogItem[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentTranscription, setCurrentTranscription] =
    useState<CurrentTranscription | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState<string>('');

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
        console.log('🔍 Transcript received:', {
          text,
          currentResultId: currentTranscription?.filename,
          allResults: currentTranscription ? [currentTranscription] : [],
        });

        setCurrentTranscript('');

        if (currentTranscription?.filename) {
          console.log(
            '🔍 Attempting to update result with ID:',
            currentTranscription.filename
          );
          setCurrentTranscription((prev) =>
            prev
              ? { ...prev, transcript: text, status: 'completed' as const }
              : null
          );
        } else {
          console.log(
            '⚠️ No currentTranscription found, creating new entry with transcript'
          );
          // Create a new transcription entry with the transcript
          setCurrentTranscription({
            filename: 'Audio File',
            transcript: text,
            status: 'completed' as const,
          });
        }
        addEvent('user_transcript_done', { text });
      },
      onTranscriptionError: (error: Error) => {
        if (currentTranscription?.filename) {
          setCurrentTranscription((prev) =>
            prev
              ? { ...prev, status: 'error' as const, error: error.message }
              : null
          );
        }
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

  // Handle file upload and processing
  const processAudioFile = async (file: File) => {
    if (!clientRef.current || !connected) {
      addEvent('file_processing_error', {
        error: 'Not connected to transcription service',
      });
      return;
    }

    const resultId = `result-${Date.now()}`;
    setCurrentTranscription({
      filename: file.name,
      transcript: '',
      status: 'processing',
    });
    setIsProcessing(true);

    try {
      addEvent('file_processing_started', {
        filename: file.name,
        size: file.size,
        type: file.type,
      });

      // CHUNKED UPLOAD IMPLEMENTATION
      const CHUNK_SIZE = 512 * 1024; // 512KB
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      for (let i = 0; i < uint8Array.length; i += CHUNK_SIZE) {
        const chunk = uint8Array.slice(i, i + CHUNK_SIZE);
        // Convert chunk to base64 safely
        let binary = '';
        for (let j = 0; j < chunk.length; j++) {
          binary += String.fromCharCode(chunk[j]);
        }
        const base64Chunk = btoa(binary);
        await clientRef.current.appendAudioData(base64Chunk);
      }
      await clientRef.current.commitAudioBuffer();

      addEvent('file_processing_completed', {
        filename: file.name,
        resultId,
      });
      console.log('🔍 File processing completed, waiting for transcript...');
      // Note: The actual transcript will be updated via the onUserTranscriptDone callback
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      addEvent('file_processing_error', {
        filename: file.name,
        error: errorMessage,
      });
      // Update result with error
      setCurrentTranscription((prev) =>
        prev ? { ...prev, status: 'error' as const, error: errorMessage } : null
      );
      console.log('🔍 Error occurred, cleared currentResultId');
    } finally {
      setIsProcessing(false);
      console.log(
        '🔍 setIsProcessing(false) called, currentResultId:',
        currentTranscription?.filename
      );
    }
  };

  // Unified handler for both upload and recording
  const handleAudioReady = async (audioBlob: Blob, filename: string) => {
    // Only allow .wav for direct send
    if (filename.toLowerCase().endsWith('.wav')) {
      // Wrap Blob as File for processAudioFile
      const wavFile = new File([audioBlob], filename, { type: 'audio/wav' });
      processAudioFile(wavFile);
    } else {
      // For .webm (recorded), show error/info
      addEvent('file_rejected', {
        filename,
        reason:
          'Browser recording produces .webm (Opus). For production, convert to mono PCM16 .wav at 24kHz before sending to OpenAI.',
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

  // Clear results
  const handleClearResults = () => {
    setCurrentTranscription(null);
    addEvent('results_cleared', {});
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Status Bar */}
      <StatusBar
        connected={connected}
        micEnabled={false}
        error={error}
        isResponding={isProcessing}
        conversationItemCount={currentTranscription ? 1 : 0}
        transcriptionEnabled={
          transcriptionConfig.input_audio_transcription !== null
        }
        onDisconnect={handleDisconnect}
      />

      {/* Session Management */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Voice Transcription Service
        </h2>

        <div className="space-y-4">
          {/* Session Creation */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Start Transcription Service
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Click the button below to create a new OpenAI Realtime
              transcription session.
            </p>
            <button
              onClick={handleCreateSession}
              disabled={isCreatingSession || connected}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isCreatingSession
                ? 'Starting Service...'
                : 'Start Transcription Service'}
            </button>
          </div>
        </div>
      </div>

      {/* Audio Input Area (Upload + Push-to-Talk) */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Upload or Record Audio
        </h3>
        <AudioInputPanel
          onAudioReady={handleAudioReady}
          disabled={!connected || isProcessing}
        />
        {!connected && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Please start the transcription service before uploading or
              recording files.
            </p>
          </div>
        )}
      </div>

      {/* Transcription Results */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Transcription Results
          </h3>
          {currentTranscription && (
            <button
              onClick={handleClearResults}
              className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-900/40 transition-colors"
            >
              Clear All
            </button>
          )}
        </div>

        <div className="space-y-4">
          {currentTranscription === null ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <p className="text-lg font-medium mb-2">No Results Yet</p>
              <p className="text-sm">
                Upload audio files to see transcription results here
              </p>
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {currentTranscription.filename}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {currentTranscription.status === 'processing' ? (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          Processing...
                        </span>
                      </div>
                    ) : currentTranscription.status === 'completed' ? (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span className="text-xs text-green-600 dark:text-green-400">
                          Completed
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        <span className="text-xs text-red-600 dark:text-red-400">
                          Error
                        </span>
                      </div>
                    )}
                  </span>
                </div>
              </div>

              {currentTranscription.status === 'completed' && (
                <div className="bg-slate-50 dark:bg-slate-700 rounded-md p-3">
                  <p className="text-sm text-slate-900 dark:text-slate-100">
                    {currentTranscription.transcript ||
                      'No transcript available'}
                  </p>
                </div>
              )}

              {currentTranscription.status === 'processing' &&
                currentTranscript && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      {currentTranscript}
                      <span className="inline-block w-2 h-4 bg-blue-500 ml-1 animate-pulse" />
                    </p>
                  </div>
                )}

              {currentTranscription.status === 'error' &&
                currentTranscription.error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                    <p className="text-sm text-red-800 dark:text-red-200">
                      Error: {currentTranscription.error}
                    </p>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>

      {/* Event Log */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
        <EventLog events={events} />
      </div>
    </div>
  );
}
