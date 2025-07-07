'use client';

import { useState, useEffect } from 'react';

interface StatusBarProps {
  connected: boolean;
  micEnabled: boolean;
  error: Error | null;
  isResponding?: boolean;
  conversationItemCount?: number;
  transcriptionEnabled?: boolean;
  onDisconnect?: () => void;
}

export function StatusBar({
  connected,
  micEnabled,
  error,
  isResponding = false,
  conversationItemCount = 0,
  transcriptionEnabled = false,
  onDisconnect,
}: StatusBarProps) {
  const [currentTime, setCurrentTime] = useState<string>('');

  // Update time on client-side only to avoid hydration mismatch
  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString());
    };

    // Set initial time
    updateTime();

    // Update every second
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (error) return 'text-red-600 dark:text-red-400';
    if (connected) return 'text-green-600 dark:text-green-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const getStatusText = () => {
    if (error) return `Error: ${error.message}`;
    if (connected) {
      if (isResponding) return 'AI is responding...';
      if (micEnabled) return 'Recording audio...';
      return 'Connected and ready';
    }
    return 'Disconnected';
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between">
        {/* Status Information */}
        <div className="flex items-center gap-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                error
                  ? 'bg-red-500'
                  : connected
                    ? 'bg-green-500'
                    : 'bg-gray-400'
              }`}
            />
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
          </div>

          {/* Microphone Status */}
          {connected && (
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  micEnabled ? 'bg-red-500 animate-pulse' : 'bg-gray-400'
                }`}
              />
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {micEnabled ? 'Mic Active' : 'Mic Inactive'}
              </span>
            </div>
          )}

          {/* Transcription Status */}
          {connected && (
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  transcriptionEnabled ? 'bg-blue-500' : 'bg-gray-400'
                }`}
              />
              <span className="text-xs text-slate-600 dark:text-slate-400">
                {transcriptionEnabled
                  ? 'Transcription On'
                  : 'Transcription Off'}
              </span>
            </div>
          )}

          {/* Response Status */}
          {connected && isResponding && (
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-xs text-slate-600 dark:text-slate-400">
                AI Responding
              </span>
            </div>
          )}
        </div>

        {/* Statistics */}
        <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
          {connected && (
            <>
              <span>Items: {conversationItemCount}</span>
              <span>•</span>
            </>
          )}
          <span>{currentTime}</span>
        </div>

        {/* Disconnect Button */}
        {connected && onDisconnect && (
          <button
            onClick={onDisconnect}
            className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Disconnect
          </button>
        )}
      </div>

      {/* Error Details */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-800 dark:text-red-200">
            <strong>Error Details:</strong> {error.message}
          </p>
          {error.stack && (
            <details className="mt-2">
              <summary className="text-xs text-red-600 dark:text-red-400 cursor-pointer">
                Show Stack Trace
              </summary>
              <pre className="mt-2 text-xs text-red-700 dark:text-red-300 whitespace-pre-wrap">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
