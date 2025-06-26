'use client';

interface VoiceControlsProps {
  connected: boolean;
  micEnabled: boolean;
  onVoiceToggle: () => void;
  isResponding?: boolean;
  onCancelResponse?: () => void;
}

export function VoiceControls({
  connected,
  micEnabled,
  onVoiceToggle,
  isResponding = false,
  onCancelResponse,
}: VoiceControlsProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Voice Controls
      </h3>

      <div className="space-y-4">
        {/* Voice Input Toggle */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Microphone
          </label>
          <button
            onClick={onVoiceToggle}
            disabled={!connected}
            className={`w-full px-4 py-3 rounded-md font-medium transition-colors ${
              micEnabled
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {micEnabled ? 'Stop Recording' : 'Start Recording'}
          </button>
        </div>

        {/* Response Controls */}
        {connected && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Response Control
            </label>
            <div className="space-y-2">
              {isResponding && onCancelResponse && (
                <button
                  onClick={onCancelResponse}
                  className="w-full px-4 py-3 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors font-medium"
                >
                  Cancel Response
                </button>
              )}

              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700 rounded-md">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isResponding ? 'bg-orange-500 animate-pulse' : 'bg-gray-400'
                  }`}
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {isResponding ? 'AI is responding...' : 'Ready for input'}
                </span>
              </div>
            </div>
          </div>
        )}

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
        </div>
      </div>
    </div>
  );
}
