'use client';

import React, { useState } from 'react';
import WebRTCPlayer from './WebRTCPlayer';
import TextMessageInput from './TextMessageInput';
import PushToTalk from './PushToTalk';
import { useSession } from '../context/OpenAIRealtimeWebRTC';
import {
  SessionConfig,
  Modality,
  TurnDetectionConfig,
  TurnDetectionType,
  RealtimeEventType,
  Voice,
} from '../types';
import tools from './openAITools';
import Transcripts from './Transcripts';
import TokenUsage from './TokenUsage';

// Add voice options based on OpenAI's available voices
const VOICE_OPTIONS = {
  alloy: 'Alloy (Neutral)',
  ash: 'Ash (Neutral)',
  echo: 'Echo (Male)',
  coral: 'Coral (Female)',
  shimmer: 'Shimmer (Female)',
  ballad: 'Ballad (Male)',
  sage: 'Sage (Male)',
  verse: 'Verse (Female)',
} as const;

type VoiceId = keyof typeof VOICE_OPTIONS;

const defaultTurnDetection: TurnDetectionConfig = {
  type: TurnDetectionType.SERVER_VAD,
  threshold: 0.5,
  prefix_padding_ms: 300,
  silence_duration_ms: 500,
};

const Chat: React.FC = () => {
  const [mode, setMode] = useState<'vad' | 'push-to-talk'>('vad');
  const [selectedVoice, setSelectedVoice] = useState<VoiceId>('alloy');
  const [config, setConfig] = useState<SessionConfig>({
    modalities: [Modality.TEXT, Modality.AUDIO],
    input_audio_transcription: {
      model: 'whisper-1',
    },
    voice: selectedVoice as Voice, // Add voice configuration
    instructions: `
      You are a fortune teller. You can see the future.
    `,
    turn_detection: defaultTurnDetection,
    tools,
  });

  const {
    startSession,
    sendClientEvent,
    closeSession,
    session,
    sendAudioChunk,
    commitAudioBuffer,
    createResponse,
    sendTextMessage,
    muteSessionAudio,
    unmuteSessionAudio,
  } = useSession();

  async function createNewSession(updatedConfig: SessionConfig) {
    const session = await (
      await fetch('/api/session', {
        method: 'POST',
        body: JSON.stringify(updatedConfig),
      })
    ).json();
    return session;
  }

  async function onSessionStart() {
    const newSession = await createNewSession(config);
    startSession({ ...newSession }, handleFunctionCall);
  }

  const handleModeChange = (newMode: 'vad' | 'push-to-talk') => {
    setMode(newMode);

    const updatedConfig: SessionConfig = {
      ...config,
      turn_detection: newMode === 'vad' ? defaultTurnDetection : null,
    };
    setConfig(updatedConfig);

    if (session?.isConnected) {
      sendClientEvent({
        type: RealtimeEventType.SESSION_UPDATE,
        session: {
          turn_detection: updatedConfig.turn_detection,
        },
      });
    }
  };

  const handleVoiceChange = (newVoice: VoiceId) => {
    setSelectedVoice(newVoice);
    const updatedConfig: SessionConfig = {
      ...config,
      voice: newVoice as Voice,
    };
    setConfig(updatedConfig);

    // If session is active, update it
    if (session?.isConnected) {
      sendClientEvent({
        type: RealtimeEventType.SESSION_UPDATE,
        session: {
          voice: newVoice as Voice,
        },
      });
    }
  };

  /**
   * Function call handler for handling model-triggered functions.
   * @param name - The name of the function being called.
   * @param args - The arguments passed to the function.
   */
  const handleFunctionCall = (name: string, args: Record<string, unknown>) => {
    console.log(`Function call received: ${name}`, args);

    switch (name) {
      case 'change_background':
        handleChangeBackground(args.color as string);
        break;

      case 'zoom_content':
        handleZoomContent(args.zoomLevel as number);
        break;

      default:
        console.warn(`Unhandled function call: ${name}`);
    }
  };

  /**
   * Changes the background color of the application.
   * @param color - The color to set as the background.
   */
  const handleChangeBackground = (color: string) => {
    document.body.style.backgroundColor = color;
    console.log(`Background color changed to: ${color}`);
  };

  /**
   * Zooms in or out of the application content.
   * @param zoomLevel - The zoom level to apply.
   */
  const handleZoomContent = (zoomLevel: number) => {
    document.body.style.transform = `scale(${zoomLevel})`;
    console.log(`Content zoomed to level: ${zoomLevel}`);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4 bg-white rounded-lg shadow-lg space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">AI Chat</h1>
        {/* Token Usage Section */}
        {session?.tokenUsage && (
          <div className="mt-2">
            <TokenUsage
              inputTokens={session.tokenUsage.inputTokens}
              outputTokens={session.tokenUsage.outputTokens}
              totalTokens={session.tokenUsage.totalTokens}
            />
          </div>
        )}
        <div className="flex items-center space-x-4">
          {/* Voice Selector */}
          <select
            value={selectedVoice}
            onChange={(e) => handleVoiceChange(e.target.value as VoiceId)}
            className="border border-gray-300 rounded px-2 py-1 bg-white text-gray-700"
          >
            {Object.entries(VOICE_OPTIONS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>

          {/* Mode Switcher */}
          <select
            value={mode}
            onChange={(e) => handleModeChange(e.target.value as 'vad' | 'push-to-talk')}
            className="border border-gray-300 rounded px-2 py-1 bg-white text-gray-700"
          >
            <option value="vad">VAD</option>
            <option value="push-to-talk">Push-to-Talk</option>
          </select>

          {/* Start/End Session Button */}
          {session?.isConnected ? (
            <button
              onClick={() => closeSession()}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
            >
              End Session
            </button>
          ) : (
            <button
              onClick={() => onSessionStart()}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
            >
              Start Session
            </button>
          )}
        </div>
      </div>

      {/* WebRTC Player */}
      <div className="border-t pt-4">
        {session?.mediaStream && (
          <WebRTCPlayer
            remoteStream={session?.mediaStream}
            isMuted={session?.isMuted ?? false}
            onMute={muteSessionAudio}
            onUnmute={unmuteSessionAudio}
          />
        )}
      </div>

      {/* Error Section */}
      {session?.errors && session.errors.length > 0 && (
        <div className="border-t pt-4">
          <h2 className="text-lg font-bold text-red-600">Errors</h2>
          <div className="overflow-y-auto max-h-32 border rounded p-4 bg-red-50">
            {session.errors.map((error, index) => (
              <div key={index} className="mb-2">
                <p className="text-sm text-red-800">
                  <strong>Error Type:</strong> {error.type}
                </p>
                {error.message && (
                  <p className="text-sm text-red-700">
                    <strong>Message:</strong> {error.message}
                  </p>
                )}
                {error.code && (
                  <p className="text-sm text-red-700">
                    <strong>Code:</strong> {error.code}
                  </p>
                )}
                {error.param && (
                  <p className="text-sm text-red-700">
                    <strong>Param:</strong> {error.param}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  <strong>Event ID:</strong> {error.event_id} |{' '}
                  <strong>Timestamp:</strong>{' '}
                  {new Date(error.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transcripts Box */}
      {session?.transcripts && session?.transcripts?.length > 0 && (
        <Transcripts transcripts={session.transcripts} />
      )}

      {/* Mode-Based Input */}
      {session?.modalities?.includes(Modality.AUDIO) && (
        <div className="border-t pt-4">
          {mode === 'push-to-talk' ? (
            <PushToTalk
              onRecording={(audio) => {
                sendAudioChunk(audio);
              }}
              onRecordingStopped={() => {
                commitAudioBuffer();
                createResponse();
              }}
            />
          ) : (
            <p className="text-gray-600 text-sm italic">
              Voice Activity Detection (VAD) mode enabled. Start speaking to
              interact.
            </p>
          )}
        </div>
      )}

      {/* Text Message Input */}
      {session?.modalities?.includes(Modality.TEXT) && (
        <div className="border-t pt-4">
          <TextMessageInput
            onNewMessage={(message) => {
              sendTextMessage(message);
            }}
            onGenerateResponse={() => {
              createResponse();
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Chat;
