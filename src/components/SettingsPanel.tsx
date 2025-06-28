'use client';

import {
  SessionConfig,
  TranscriptionSessionConfig,
  Voice,
  AudioFormat,
  Modality,
  TranscriptionModel,
  TranscriptionConfig,
  TurnDetectionType,
} from '@/lib/openai-realtime/types';

interface SettingsPanelProps {
  config: SessionConfig | TranscriptionSessionConfig;
  onConfigChange: (
    config: Partial<SessionConfig> | Partial<TranscriptionSessionConfig>
  ) => void;
  disabled: boolean;
  sessionType: 'regular' | 'transcription';
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

const MODALITY_OPTIONS = [
  { value: [Modality.AUDIO, Modality.TEXT], label: 'Audio + Text (Default)' },
  { value: [Modality.TEXT], label: 'Text Only' },
];

const TRANSCRIPTION_MODEL_OPTIONS = [
  {
    value: TranscriptionModel.GPT4O_TRANSCRIBE,
    label: 'GPT-4o Transcribe (Best Quality)',
  },
  {
    value: TranscriptionModel.GPT4O_MINI_TRANSCRIBE,
    label: 'GPT-4o Mini Transcribe (Fast)',
  },
  { value: TranscriptionModel.WHISPER_1, label: 'Whisper-1 (Legacy)' },
];

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'it', label: 'Italian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ru', label: 'Russian' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
];

const VAD_TYPE_OPTIONS = [
  { value: TurnDetectionType.SERVER_VAD, label: 'Server VAD (default)' },
  { value: TurnDetectionType.SEMANTIC_VAD, label: 'Semantic VAD' },
];

export function SettingsPanel({
  config,
  onConfigChange,
  disabled,
  sessionType,
}: SettingsPanelProps) {
  // Type guards to check session type
  const isRegularSession = (
    config: SessionConfig | TranscriptionSessionConfig
  ): config is SessionConfig => {
    return sessionType === 'regular';
  };

  // Helper function to handle transcription toggle
  const handleTranscriptionToggle = (enabled: boolean) => {
    if (enabled) {
      onConfigChange({
        input_audio_transcription: {
          model: TranscriptionModel.GPT4O_TRANSCRIBE,
          language: 'en',
        },
      });
    } else {
      onConfigChange({
        input_audio_transcription: null,
      });
    }
  };

  // Helper function to update transcription config
  const updateTranscriptionConfig = (updates: Partial<TranscriptionConfig>) => {
    if (config.input_audio_transcription) {
      onConfigChange({
        input_audio_transcription: {
          ...config.input_audio_transcription,
          ...updates,
        },
      });
    }
  };

  const transcriptionEnabled = config.input_audio_transcription !== null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        {sessionType === 'regular'
          ? 'Chat Session Settings'
          : 'Transcription Session Settings'}
      </h3>

      <div className="space-y-4">
        {/* VAD Type Selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Voice Activity Detection (VAD) Type
          </label>
          <select
            value={config.turn_detection?.type || TurnDetectionType.SERVER_VAD}
            onChange={(e) =>
              onConfigChange({
                turn_detection: {
                  ...config.turn_detection,
                  type: e.target.value as TurnDetectionType,
                },
              })
            }
            disabled={disabled}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {VAD_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Choose how the system detects when you are speaking.
          </p>
        </div>

        {/* Transcription Settings */}
        <div className="border border-slate-200 dark:border-slate-600 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-md font-medium text-slate-900 dark:text-slate-100">
              Audio Transcription
            </h4>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={transcriptionEnabled}
                onChange={(e) => handleTranscriptionToggle(e.target.checked)}
                disabled={disabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 dark:bg-slate-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600 disabled:opacity-50"></div>
              <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                {transcriptionEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </label>
          </div>

          {transcriptionEnabled && (
            <div className="space-y-3">
              {/* Transcription Model */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Transcription Model
                </label>
                <select
                  value={
                    config.input_audio_transcription?.model ||
                    TranscriptionModel.GPT4O_TRANSCRIBE
                  }
                  onChange={(e) =>
                    updateTranscriptionConfig({
                      model: e.target.value as TranscriptionModel,
                    })
                  }
                  disabled={disabled}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {TRANSCRIPTION_MODEL_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Language
                </label>
                <select
                  value={config.input_audio_transcription?.language || 'en'}
                  onChange={(e) =>
                    updateTranscriptionConfig({
                      language: e.target.value,
                    })
                  }
                  disabled={disabled}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  {LANGUAGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Prompt */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Transcription Prompt (Optional)
                </label>
                <textarea
                  value={config.input_audio_transcription?.prompt || ''}
                  onChange={(e) =>
                    updateTranscriptionConfig({ prompt: e.target.value })
                  }
                  disabled={disabled}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
                  placeholder="Keywords for whisper-1, free text for gpt-4o-transcribe models..."
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Keywords for whisper-1, free text for gpt-4o-transcribe models
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modality Selection - Only for regular sessions */}
        {isRegularSession(config) && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Modalities
            </label>
            <select
              value={JSON.stringify(config.modalities)}
              onChange={(e) =>
                onConfigChange({ modalities: JSON.parse(e.target.value) })
              }
              disabled={disabled}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {MODALITY_OPTIONS.map((option) => (
                <option key={option.label} value={JSON.stringify(option.value)}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Choose whether to enable audio, text, or both modalities
            </p>
          </div>
        )}

        {/* Regular Session Only Settings */}
        {isRegularSession(config) && (
          <>
            {/* Voice Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Voice
              </label>
              <select
                value={config.voice}
                onChange={(e) =>
                  onConfigChange({ voice: e.target.value as Voice })
                }
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
                onChange={(e) =>
                  onConfigChange({ instructions: e.target.value })
                }
                disabled={disabled}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 resize-none"
                placeholder="Enter system instructions for the AI..."
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
