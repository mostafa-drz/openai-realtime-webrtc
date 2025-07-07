'use client';

import { useState, useRef, useEffect } from 'react';
import { Item, MessageRole, ContentType } from '@/lib/openai-realtime/types';

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

interface ConversationPanelProps {
  connected: boolean;
  events: EventLogItem[];
  conversationItems: Item[];
  isResponding: boolean;
  onSendTextMessage: (text: string) => void;
  sessionType: string;
  // New transcript props
  liveUserTranscript: string;
  liveAssistantTranscript: string;
  liveTextTokens: string;
  conversationHistory: ConversationHistoryItem[];
  transcriptionError: string | null;
}

export function ConversationPanel({
  connected,
  events,
  conversationItems,
  isResponding,
  onSendTextMessage,
  sessionType,
  // New transcript props
  liveUserTranscript,
  liveAssistantTranscript,
  liveTextTokens,
  conversationHistory,
  transcriptionError,
}: ConversationPanelProps) {
  const [textInput, setTextInput] = useState('');
  const conversationEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [
    conversationItems,
    liveUserTranscript,
    liveAssistantTranscript,
    liveTextTokens,
    conversationHistory,
    transcriptionError,
  ]);

  // Handle text message submission
  const handleSendMessage = () => {
    if (textInput.trim() && connected) {
      onSendTextMessage(textInput.trim());
      setTextInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
                : 'bg-green-500 text-white'
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

  // Render live user transcript (streaming)
  const renderLiveUserTranscript = () => {
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

  // Render live assistant transcript (streaming)
  const renderLiveAssistantTranscript = () => {
    if (!liveAssistantTranscript && !liveTextTokens) return null;

    return (
      <div className="flex justify-start mb-4">
        <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-green-400 text-white">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs opacity-75">
              🤖 Assistant (speaking...)
            </span>
          </div>
          <p className="text-sm">
            {liveAssistantTranscript || liveTextTokens}
            <span className="inline-block w-2 h-4 bg-white ml-1 animate-pulse" />
          </p>
        </div>
      </div>
    );
  };

  // Render legacy conversation items (for backward compatibility)
  const renderConversationItems = () => {
    return conversationItems.map((item, index) => {
      if (item.type === 'message') {
        const isUser = item.role === MessageRole.USER;
        // Find the first text content (could be input_text or text)
        const textContent = item.content.find(
          (content) =>
            content.type === ContentType.TEXT ||
            content.type === ContentType.INPUT_TEXT
        );
        if (textContent && 'text' in textContent) {
          return (
            <div
              key={item.id || index}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isUser ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs opacity-75">
                    {isUser ? '👤 You' : '🤖 Assistant'}
                  </span>
                </div>
                <p className="text-sm">{textContent.text}</p>
              </div>
            </div>
          );
        }
      }
      return null;
    });
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 h-[600px] flex flex-col">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex-shrink-0">
        Conversation
      </h3>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Conversation Flow - Scrollable Area */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-2">
          {/* Legacy Conversation Items (for backward compatibility) */}
          {conversationItems.length > 0 && (
            <div className="space-y-4">{renderConversationItems()}</div>
          )}

          {/* New Conversation History */}
          {conversationHistory.map(renderMessage)}

          {/* Live Transcripts (streaming) */}
          {renderLiveUserTranscript()}
          {renderLiveAssistantTranscript()}

          {/* Empty State */}
          {!liveUserTranscript &&
            !liveAssistantTranscript &&
            !liveTextTokens &&
            conversationHistory.length === 0 &&
            conversationItems.length === 0 &&
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
                <p className="text-lg font-medium mb-2">Ready to Chat</p>
                <p className="text-sm">
                  Start speaking or type a message to begin the conversation
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
              <p className="text-sm">Create a session to start chatting</p>
            </div>
          )}

          {/* Invisible div for auto-scrolling */}
          <div ref={conversationEndRef} />
        </div>

        {/* Text Input (only for regular sessions) */}
        {sessionType === 'regular' && connected && (
          <div className="flex-shrink-0 mt-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isResponding}
              />
              <button
                onClick={handleSendMessage}
                disabled={!textInput.trim() || isResponding}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        )}

        {/* Status Bar */}
        <div className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4 flex-shrink-0">
          {conversationHistory.length + conversationItems.length} messages •{' '}
          {events.length} events logged
          {transcriptionError && (
            <span className="text-red-500 ml-2">• Error detected</span>
          )}
          {isResponding && (
            <span className="text-green-500 ml-2">• AI responding</span>
          )}
        </div>
      </div>
    </div>
  );
}
