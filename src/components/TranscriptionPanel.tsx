'use client';

import { useRef, useEffect } from 'react';

interface EventLogItem {
  id: string;
  type: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

interface ConversationHistoryItem {
  id: string;
  speaker: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  type: 'transcript' | 'text' | 'error';
}

interface TranscriptionPanelProps {
  connected: boolean;
  events: EventLogItem[];
  liveUserTranscript: string;
  conversationHistory: ConversationHistoryItem[];
  transcriptionError: string | null;
}

export function TranscriptionPanel({
  connected,
  events,
  liveUserTranscript,
  conversationHistory,
  transcriptionError,
}: TranscriptionPanelProps) {
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [liveUserTranscript, conversationHistory, transcriptionError]);

  // Render a single message bubble
  const renderMessage = (item: ConversationHistoryItem) => {
    const isUser = item.speaker === 'user';
    const isError = item.type === 'error';

    return (
      <div
        key={item.id}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div
          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
            isError
              ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200'
              : isUser
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs opacity-75">
              {isUser ? '👤 You' : '🤖 Assistant'}
            </span>
            <span className="text-xs opacity-50">
              {item.timestamp.toLocaleTimeString()}
            </span>
          </div>
          <p className="text-sm">{item.text}</p>
        </div>
      </div>
    );
  };

  // Render live transcript (streaming)
  const renderLiveTranscript = () => {
    if (!liveUserTranscript) return null;

    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-blue-400 text-white">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs opacity-75">👤 You (speaking...)</span>
          </div>
          <p className="text-sm">
            {liveUserTranscript}
            <span className="inline-block w-2 h-4 bg-white ml-1 animate-pulse" />
          </p>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 h-[600px] flex flex-col">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex-shrink-0">
        Live Transcription
      </h3>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Chat Messages - Scrollable Area */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {/* Conversation History */}
          {conversationHistory.map(renderMessage)}

          {/* Live User Transcript (streaming) */}
          {renderLiveTranscript()}

          {/* Empty State */}
          {!liveUserTranscript &&
            conversationHistory.length === 0 &&
            !transcriptionError &&
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
          <div ref={chatEndRef} />
        </div>

        {/* Status Bar */}
        <div className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4 flex-shrink-0">
          {conversationHistory.length} messages • {events.length} events logged
          {transcriptionError && (
            <span className="text-red-500 ml-2">• Error detected</span>
          )}
        </div>
      </div>
    </div>
  );
}
