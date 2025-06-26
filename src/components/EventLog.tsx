'use client';

import { useState } from 'react';
import { ServerEventType } from '@/lib/openai-realtime/types';

interface EventLogItem {
  id: string;
  type: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

interface EventLogProps {
  events: EventLogItem[];
}

export function EventLog({ events }: EventLogProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getEventColor = (type: string) => {
    // Use real event types for better categorization
    switch (type) {
      // Text and audio streaming events
      case ServerEventType.RESPONSE_TEXT_DELTA:
        return 'text-green-600 dark:text-green-400';
      case ServerEventType.RESPONSE_AUDIO_TRANSCRIPT_DELTA:
        return 'text-blue-600 dark:text-blue-400';
      case ServerEventType.RESPONSE_AUDIO_DELTA:
        return 'text-purple-600 dark:text-purple-400';

      // Connection and session events
      case 'connection_state_change':
        return 'text-indigo-600 dark:text-indigo-400';
      case ServerEventType.SESSION_CREATED:
      case ServerEventType.SESSION_UPDATED:
        return 'text-orange-600 dark:text-orange-400';

      // Conversation events
      case ServerEventType.CONVERSATION_ITEM_CREATED:
        return 'text-emerald-600 dark:text-emerald-400';
      case ServerEventType.CONVERSATION_ITEM_DELETED:
        return 'text-red-600 dark:text-red-400';

      // Response events
      case ServerEventType.RESPONSE_CREATED:
        return 'text-cyan-600 dark:text-cyan-400';
      case ServerEventType.RESPONSE_DONE:
        return 'text-green-600 dark:text-green-400';
      case ServerEventType.RESPONSE_CANCELLED:
        return 'text-yellow-600 dark:text-yellow-400';

      // Speech detection events
      case ServerEventType.INPUT_AUDIO_BUFFER_SPEECH_STARTED:
        return 'text-pink-600 dark:text-pink-400';
      case ServerEventType.INPUT_AUDIO_BUFFER_SPEECH_STOPPED:
        return 'text-gray-600 dark:text-gray-400';

      // Audio buffer events
      case ServerEventType.INPUT_AUDIO_BUFFER_COMMITTED:
      case ServerEventType.INPUT_AUDIO_BUFFER_CLEARED:
        return 'text-violet-600 dark:text-violet-400';

      // Error events
      case ServerEventType.ERROR:
        return 'text-red-600 dark:text-red-400';

      // Custom events
      case 'voice_started':
      case 'voice_stopped':
        return 'text-indigo-600 dark:text-indigo-400';
      case 'text_message_sent':
        return 'text-blue-600 dark:text-blue-400';
      case 'response_requested':
        return 'text-cyan-600 dark:text-cyan-400';
      case 'session_creating':
      case 'session_connected':
      case 'session_disconnected':
        return 'text-orange-600 dark:text-orange-400';

      default:
        return 'text-slate-600 dark:text-slate-400';
    }
  };

  const getEventIcon = (type: string) => {
    // Use real event types for better icon mapping
    switch (type) {
      // Text and audio streaming events
      case ServerEventType.RESPONSE_TEXT_DELTA:
        return '💬';
      case ServerEventType.RESPONSE_AUDIO_TRANSCRIPT_DELTA:
        return '🎤';
      case ServerEventType.RESPONSE_AUDIO_DELTA:
        return '🔊';

      // Connection and session events
      case 'connection_state_change':
        return '🔗';
      case ServerEventType.SESSION_CREATED:
        return '✨';
      case ServerEventType.SESSION_UPDATED:
        return '⚙️';

      // Conversation events
      case ServerEventType.CONVERSATION_ITEM_CREATED:
        return '💭';
      case ServerEventType.CONVERSATION_ITEM_DELETED:
        return '🗑️';

      // Response events
      case ServerEventType.RESPONSE_CREATED:
        return '🚀';
      case ServerEventType.RESPONSE_DONE:
        return '✅';
      case ServerEventType.RESPONSE_CANCELLED:
        return '⏹️';

      // Speech detection events
      case ServerEventType.INPUT_AUDIO_BUFFER_SPEECH_STARTED:
        return '🎙️';
      case ServerEventType.INPUT_AUDIO_BUFFER_SPEECH_STOPPED:
        return '🔇';

      // Audio buffer events
      case ServerEventType.INPUT_AUDIO_BUFFER_COMMITTED:
        return '📤';
      case ServerEventType.INPUT_AUDIO_BUFFER_CLEARED:
        return '🧹';

      // Error events
      case ServerEventType.ERROR:
        return '❌';

      // Custom events
      case 'voice_started':
        return '🎙️';
      case 'voice_stopped':
        return '🔇';
      case 'text_message_sent':
        return '📝';
      case 'response_requested':
        return '🤔';
      case 'session_creating':
        return '⏳';
      case 'session_connected':
        return '✅';
      case 'session_disconnected':
        return '🔌';

      default:
        return '📝';
    }
  };

  const getEventDescription = (type: string) => {
    // Provide human-readable descriptions for event types
    switch (type) {
      case ServerEventType.RESPONSE_TEXT_DELTA:
        return 'AI text streaming';
      case ServerEventType.RESPONSE_AUDIO_TRANSCRIPT_DELTA:
        return 'Audio transcript streaming';
      case ServerEventType.RESPONSE_AUDIO_DELTA:
        return 'AI audio streaming';
      case 'connection_state_change':
        return 'Connection state changed';
      case ServerEventType.SESSION_CREATED:
        return 'Session created';
      case ServerEventType.SESSION_UPDATED:
        return 'Session updated';
      case ServerEventType.CONVERSATION_ITEM_CREATED:
        return 'Conversation item created';
      case ServerEventType.RESPONSE_CREATED:
        return 'AI response started';
      case ServerEventType.RESPONSE_DONE:
        return 'AI response completed';
      case ServerEventType.RESPONSE_CANCELLED:
        return 'AI response cancelled';
      case ServerEventType.INPUT_AUDIO_BUFFER_SPEECH_STARTED:
        return 'Speech detected';
      case ServerEventType.INPUT_AUDIO_BUFFER_SPEECH_STOPPED:
        return 'Speech ended';
      case ServerEventType.ERROR:
        return 'Error occurred';
      default:
        return type;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg">
      {/* Header */}
      <div
        className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Event Log
            </h3>
            <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs rounded-full">
              {events.length} events
            </span>
          </div>
          <svg
            className={`w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* Event List */}
      {isExpanded && (
        <div className="border-t border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
          {events.length === 0 ? (
            <div className="p-4 text-center text-slate-500 dark:text-slate-400">
              No events logged yet
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {events
                .slice()
                .reverse()
                .map((event) => (
                  <div
                    key={event.id}
                    className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">
                        {getEventIcon(event.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className={`text-sm font-medium ${getEventColor(event.type)}`}
                          >
                            {getEventDescription(event.type)}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {event.timestamp.toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                          {event.type}
                        </div>
                        <div className="text-sm text-slate-700 dark:text-slate-300">
                          <pre className="whitespace-pre-wrap break-words text-xs">
                            {JSON.stringify(event.data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
