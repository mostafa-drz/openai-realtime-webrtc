'use client';

interface StatusBarProps {
  connected: boolean;
  micEnabled: boolean;
  error: Error | null;
}

export function StatusBar({ connected, micEnabled, error }: StatusBarProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between">
        {/* Status Indicators */}
        <div className="flex items-center gap-6">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                connected ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          {/* Microphone Status */}
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                micEnabled ? 'bg-red-500 animate-pulse' : 'bg-gray-400'
              }`}
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {micEnabled ? 'Recording' : 'Not Recording'}
            </span>
          </div>

          {/* Error Status */}
          {error && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                Error: {error.message}
              </span>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
