'use client';

import { useState, useRef, useEffect } from 'react';
import { Item, MessageRole, ContentType } from '@/lib/openai-realtime/types';

interface EventLogItem {
  id: string;
  type: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

interface ConversationPanelProps {
  connected: boolean;
  events: EventLogItem[];
  conversationItems: Item[];
  isResponding: boolean;
  modalities?: string[];
  onSendTextMessage: (text: string) => void;
  sessionType: string;
}

export function ConversationPanel({
  connected,
  events,
  conversationItems,
  isResponding,
  modalities = ['audio', 'text'],
  onSendTextMessage,
  sessionType,
}: ConversationPanelProps) {
  const [textInput, setTextInput] = useState('');
  const conversationEndRef = useRef<HTMLDivElement>(null);

  // Group events by conversation flow using real event types
  const conversationEvents = events.filter((event) =>
    [
      'response.text.delta',
      'response.audio_transcript.delta',
      'response.audio_transcript.done',
      'conversation.item.input_audio_transcription.delta',
      'conversation.item.input_audio_transcription.completed',
      'session.created',
      'session.updated',
      'conversation.item.created',
      'response.created',
      'response.done',
      'input_audio_buffer.speech_started',
      'input_audio_buffer.speech_stopped',
    ].includes(event.type)
  );

  // Get current conversation state from events
  // Handle input audio transcription (user speech) - both delta and completed events
  const currentInputTranscript = events
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

  // Handle response audio transcript (AI speech) - both delta and done events
  const currentResponseTranscript = events
    .filter(
      (e) =>
        e.type === 'response.audio_transcript.delta' ||
        e.type === 'response.audio_transcript.done'
    )
    .map((e) => {
      // The event data is nested in e.data.data for raw events
      const eventData = e.data.data as { delta?: string; transcript?: string };
      return eventData?.delta || eventData?.transcript || '';
    })
    .join(' ');

  const currentResponse = events
    .filter((e) => e.type === 'response.text.delta')
    .map((e) => {
      // The event data is nested in e.data.data for raw events
      const eventData = e.data.data as { delta?: string };
      return eventData?.delta || '';
    })
    .join('');

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [
    conversationItems,
    currentInputTranscript,
    currentResponseTranscript,
    currentResponse,
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

  // Render conversation items as chat thread
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
              className={`p-4 rounded-lg ${
                isUser
                  ? 'bg-blue-50 dark:bg-blue-900/20'
                  : 'bg-green-50 dark:bg-green-900/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 text-white rounded-full flex items-center justify-center text-sm font-medium ${
                    isUser ? 'bg-blue-600' : 'bg-green-600'
                  }`}
                >
                  {isUser ? 'U' : 'AI'}
                </div>
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium mb-1 ${
                      isUser
                        ? 'text-blue-900 dark:text-blue-100'
                        : 'text-green-900 dark:text-green-100'
                    }`}
                  >
                    {isUser ? 'You said:' : 'AI Response:'}
                  </p>
                  <p
                    className={
                      isUser
                        ? 'text-blue-800 dark:text-blue-200'
                        : 'text-green-800 dark:text-green-200'
                    }
                  >
                    {textContent.text}
                  </p>
                </div>
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
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {/* Conversation Items */}
          {conversationItems.length > 0 && (
            <div className="space-y-4">{renderConversationItems()}</div>
          )}

          {/* Current Live Input/Response (streaming, not yet committed) */}
          {(currentInputTranscript ||
            currentResponseTranscript ||
            currentResponse) && (
            <div className="space-y-4">
              {/* User Input (streaming) */}
              {currentInputTranscript && (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      U
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                        You said:
                      </p>
                      <p className="text-blue-800 dark:text-blue-200">
                        &quot;{currentInputTranscript}&quot;
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Response (streaming) */}
              {currentResponseTranscript && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      AI
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                        AI Response:
                      </p>
                      <p className="text-green-800 dark:text-green-200">
                        &quot;{currentResponseTranscript}&quot;
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* AI Response (text, streaming) */}
              {currentResponse && (
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
                      AI
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-900 dark:text-green-100 mb-1">
                        AI Response:
                      </p>
                      <p className="text-green-800 dark:text-green-200">
                        {currentResponse}
                        <span className="inline-block w-2 h-4 bg-green-600 dark:bg-green-400 ml-1 animate-pulse" />
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty State */}
          {!currentInputTranscript &&
            !currentResponseTranscript &&
            !currentResponse &&
            conversationItems.length === 0 &&
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
                  Use voice recording or type a message to begin your
                  conversation
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

        {/* Text Input - Fixed at bottom */}
        {connected &&
          modalities.includes('text') &&
          sessionType !== 'transcription' && (
            <div className="space-y-2 mt-4 flex-shrink-0">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Send Text Message
              </label>
              <div className="flex gap-2">
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={isResponding}
                  className="flex-1 p-3 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                  rows={2}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!textInput.trim() || isResponding}
                  className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium self-end"
                >
                  Send
                </button>
              </div>
            </div>
          )}

        {/* Event Counter */}
        <div className="text-xs text-slate-500 dark:text-slate-400 text-center mt-4 flex-shrink-0">
          {conversationEvents.length} events logged • {conversationItems.length}{' '}
          conversation items
        </div>
      </div>
    </div>
  );
}
