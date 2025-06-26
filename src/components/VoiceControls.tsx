'use client';

interface VoiceControlsProps {
  connected: boolean;
  micEnabled: boolean;
  onVoiceToggle: () => void;
}

export function VoiceControls({
  connected,
  micEnabled,
  onVoiceToggle,
}: VoiceControlsProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Voice Controls
      </h3>

      <div className="space-y-4">
        {/* Microphone Button */}
        <button
          onClick={onVoiceToggle}
          disabled={!connected}
          className={`w-full py-4 px-6 rounded-lg font-medium transition-all duration-200 ${
            micEnabled
              ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg'
              : 'bg-green-600 hover:bg-green-700 text-white shadow-lg'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <div className="flex items-center justify-center gap-3">
            <div
              className={`w-4 h-4 rounded-full ${
                micEnabled ? 'bg-red-300 animate-pulse' : 'bg-green-300'
              }`}
            />
            {micEnabled ? 'Stop Recording' : 'Start Recording'}
          </div>
        </button>

        {/* Status Indicators */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                connected ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {connected ? 'Connected' : 'Disconnected'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                micEnabled ? 'bg-red-500 animate-pulse' : 'bg-gray-400'
              }`}
            />
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {micEnabled ? 'Microphone Active' : 'Microphone Inactive'}
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 p-3 rounded-md">
          <p className="font-medium mb-1">How to use:</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Connect to start a session</li>
            <li>Click &quot;Start Recording&quot; to enable microphone</li>
            <li>Speak naturally - AI will respond in real-time</li>
            <li>Click &quot;Stop Recording&quot; when done</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
