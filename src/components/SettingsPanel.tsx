'use client';

import { SessionConfig, Voice, AudioFormat } from '@/lib/openai-realtime/types';

interface SettingsPanelProps {
  config: SessionConfig;
  onConfigChange: (config: Partial<SessionConfig>) => void;
  disabled: boolean;
}

const VOICE_OPTIONS = [
  { value: Voice.ALLOY, label: 'Alloy' },
  { value: Voice.ASH, label: 'Ash' },
  { value: Voice.BALLAD, label: 'Ballad' },
  { value: Voice.CORAL, label: 'Coral' },
  { value: Voice.ECHO, label: 'Echo' },
  { value: Voice.SAGE, label: 'Sage' },
  { value: Voice.SHIMMER, label: 'Shimmer' },
  { value: Voice.VERSE, label: 'Verse' },
];

const AUDIO_FORMAT_OPTIONS = [
  { value: AudioFormat.PCM16, label: 'PCM16 (16-bit PCM at 24kHz)' },
  { value: AudioFormat.G711_ULAW, label: 'G711 μ-law' },
  { value: AudioFormat.G711_ALAW, label: 'G711 A-law' },
];

export function SettingsPanel({
  config,
  onConfigChange,
  disabled,
}: SettingsPanelProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Session Settings
      </h3>

      <div className="space-y-4">
        {/* Voice Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Voice
          </label>
          <select
            value={config.voice}
            onChange={(e) => onConfigChange({ voice: e.target.value as Voice })}
            disabled={disabled}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {VOICE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Audio Format */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Audio Format
          </label>
          <select
            value={config.output_audio_format}
            onChange={(e) =>
              onConfigChange({
                output_audio_format: e.target.value as AudioFormat,
              })
            }
            disabled={disabled}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {AUDIO_FORMAT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Temperature */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Temperature: {config.temperature}
          </label>
          <input
            type="range"
            min="0.6"
            max="1.2"
            step="0.1"
            value={config.temperature}
            onChange={(e) =>
              onConfigChange({ temperature: parseFloat(e.target.value) })
            }
            disabled={disabled}
            className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
          />
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>Creative (0.6)</span>
            <span>Balanced (0.8)</span>
            <span>Focused (1.2)</span>
          </div>
        </div>

        {/* Speed */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Speed: {config.speed}x
          </label>
          <input
            type="range"
            min="0.25"
            max="1.5"
            step="0.25"
            value={config.speed}
            onChange={(e) =>
              onConfigChange({ speed: parseFloat(e.target.value) })
            }
            disabled={disabled}
            className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
          />
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>Slow (0.25x)</span>
            <span>Normal (1.0x)</span>
            <span>Fast (1.5x)</span>
          </div>
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Instructions
          </label>
          <textarea
            value={config.instructions}
            onChange={(e) => onConfigChange({ instructions: e.target.value })}
            disabled={disabled}
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
            placeholder="Enter system instructions for the AI..."
          />
        </div>
      </div>
    </div>
  );
}
