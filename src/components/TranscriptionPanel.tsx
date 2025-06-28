'use client';

import { useRef, useEffect } from 'react';

interface EventLogItem {
  id: string;
  type: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

interface TranscriptionPanelProps {
  connected: boolean;
  events: EventLogItem[];
}

export function TranscriptionPanel({
  connected,
  events,
}: TranscriptionPanelProps) {
  const transcriptionEndRef = useRef<HTMLDivElement>(null);

  // Filter transcription-specific events
  const transcriptionEvents = events.filter((event) =>
    [
      'conversation.item.input_audio_transcription.delta',
      'conversation.item.input_audio_transcription.completed',
      'session.created',
      'session.updated',
      'conversation.item.created',
      'input_audio_buffer.speech_started',
      'input_audio_buffer.speech_stopped',
    ].includes(event.type)
  );

  // Get current transcription state from events
  const currentTranscription = events
    .filter(
      (e) =>
        e.type === 'conversation.item.input_audio_transcription.delta' ||
        e.type === 'conversation.item.input_audio_transcription.completed'
    )
    .map((e) => {
      // The event data is nested in e.data.data for raw events
      const eventData = e.data.data as { delta?: string; transcript?: string };
      return eventData?.delta || eventData?.transcript || '';
    })
    .join('');

  // Get completed transcriptions from conversation items
  const completedTranscriptions = events
    .filter((e) => e.type === 'conversation.item.created')
    .map((e) => {
      const eventData = e.data.data as {
        item?: {
          type?: string;
          role?: string;
          content?: Array<{
            type?: string;
            text?: string;
          }>;
        };
      };
      if (
        eventData?.item?.type === 'message' &&
        eventData?.item?.role === 'user'
      ) {
        const textContent = eventData.item.content?.find(
          (c) => c.type === 'text' || c.type === 'input_text'
        );
        return textContent?.text || '';
      }
      return '';
    })
    .filter((text) => text.length > 0);

  // Auto-scroll to bottom when new transcriptions arrive
  useEffect(() => {
    transcriptionEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentTranscription, completedTranscriptions]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 h-[600px] flex flex-col">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex-shrink-0">
        Live Transcription
      </h3>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Transcription Flow - Scrollable Area */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* Completed Transcriptions */}
          {completedTranscriptions.length > 0 && (
            <div className="space-y-4">
              {completedTranscriptions.map((transcription, index) => (
                <div
                  key={index}
                  className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      T
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                        Transcribed:
                      </p>
                      <p className="text-blue-800 dark:text-blue-200">
                        &quot;{transcription}&quot;
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Current Live Transcription (streaming) */}
          {currentTranscription && (
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  T
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                    Transcribing:
                  </p>
                  <p className="text-blue-800 dark:text-blue-200">
                    &quot;{currentTranscription}&quot;
                    <span className="inline-block w-2 h-4 bg-blue-600 dark:bg-blue-400 ml-1 animate-pulse" />
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!currentTranscription &&
            completedTranscriptions.length === 0 &&
            connected && (
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
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                </div>
                <p className="text-lg font-medium mb-2">Ready to Transcribe</p>
                <p className="text-sm">
                  Start speaking to see your audio transcribed in real-time
                </p>
              </div>
            )}

          {/* Not Connected State */}
          {!connected && (
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
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <p className="text-lg font-medium mb-2">Not Connected</p>
              <p className="text-sm">Create a transcription session to start</p>
            </div>
          )}

          {/* Invisible div for auto-scrolling */}
          <div ref={transcriptionEndRef} />
        </div>

        {/* Event Counter */}
        <div className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4 flex-shrink-0">
          {transcriptionEvents.length} events logged •{' '}
          {completedTranscriptions.length} transcriptions completed
        </div>
      </div>
    </div>
  );
}
