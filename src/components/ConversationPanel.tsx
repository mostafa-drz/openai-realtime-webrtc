'use client';

interface EventLogItem {
  id: string;
  type: string;
  data: Record<string, unknown>;
  timestamp: Date;
}

interface ConversationPanelProps {
  connected: boolean;
  events: EventLogItem[];
}

export function ConversationPanel({
  connected,
  events,
}: ConversationPanelProps) {
  // Group events by conversation flow
  const conversationEvents = events.filter((event) =>
    [
      'message_token',
      'transcript',
      'connection_state',
      'session_created',
      'session_updated',
    ].includes(event.type)
  );

  // Get current conversation state
  const currentTranscript = events
    .filter((e) => e.type === 'transcript')
    .map((e) => e.data.transcript as string)
    .join(' ');

  const currentResponse = events
    .filter((e) => e.type === 'message_token')
    .map((e) => e.data.token as string)
    .join('');

  const connectionState =
    (events.filter((e) => e.type === 'connection_state').pop()?.data
      .state as string) || 'disconnected';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Conversation
      </h3>

      <div className="space-y-6">
        {/* Connection Status */}
        <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700 rounded-md">
          <div
            className={`w-3 h-3 rounded-full ${
              connected ? 'bg-green-500' : 'bg-gray-400'
            }`}
          />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
          {connectionState !== 'disconnected' && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ({connectionState})
            </span>
          )}
        </div>

        {/* Conversation Flow */}
        <div className="space-y-4">
          {/* User Input */}
          {currentTranscript && (
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
                    &quot;{currentTranscript}&quot;
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* AI Response */}
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

          {/* Empty State */}
          {!currentTranscript && !currentResponse && connected && (
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
                Click &quot;Start Recording&quot; to begin your conversation
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
              <p className="text-sm">
                Enter a client secret and connect to start chatting
              </p>
            </div>
          )}
        </div>

        {/* Event Counter */}
        <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
          {conversationEvents.length} events logged
        </div>
      </div>
    </div>
  );
}
