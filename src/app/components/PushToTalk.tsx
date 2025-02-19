'use client';

import React, { useState, useRef } from 'react';

interface Props {
  onRecording: (base64Audio: string) => void;
  onRecordingStopped: () => void;
}

const PushToTalk: React.FC<Props> = ({ onRecording, onRecordingStopped }) => {
  const [isRecording, setIsRecording] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const handleStartRecording = async () => {
    setIsRecording(true);

    // Create an AudioContext
    const audioContext = new AudioContext({
      sampleRate: 24000, // Set sample rate to 24kHz
    });
    audioContextRef.current = audioContext;

    // Request access to the user's microphone
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaStreamRef.current = stream;

    const source = audioContext.createMediaStreamSource(stream);

    // Create a ScriptProcessorNode to handle audio processing
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    source.connect(processor);
    processor.connect(audioContext.destination);

    // Process audio in PCM16 format
    processor.onaudioprocess = (event) => {
      const inputBuffer = event.inputBuffer;
      const rawData = inputBuffer.getChannelData(0); // Get mono audio data
      const pcm16Data = new Int16Array(rawData.length);

      // Convert Float32Array to Int16Array (PCM16)
      for (let i = 0; i < rawData.length; i++) {
        pcm16Data[i] = Math.max(-1, Math.min(1, rawData[i])) * 0x7fff; // Scale to Int16 range
      }

      // Encode PCM16 as Base64
      const base64Audio = btoa(
        String.fromCharCode(...new Uint8Array(pcm16Data.buffer))
      );

      // Send the audio chunk to the session
      onRecording(base64Audio);
    };
  };

  const handleStopRecording = () => {
    setIsRecording(false);

    // Stop processing
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    // Stop the microphone stream
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    // Close the AudioContext
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Commit the audio buffer to the session
    onRecordingStopped();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex flex-col items-center space-y-2">
        <button
          onMouseDown={handleStartRecording}
          onMouseUp={handleStopRecording}
          onTouchStart={handleStartRecording}
          onTouchEnd={handleStopRecording}
          className={`w-20 h-20 flex items-center justify-center rounded-full border-4 transition-all duration-200 shadow-lg focus:outline-none focus:ring-4 ${
            isRecording
              ? 'bg-red-500 border-red-700 shadow-red-500/50 focus:ring-red-300'
              : 'bg-gray-200 border-gray-400 shadow-gray-300/50 focus:ring-gray-300'
          }`}
        >
          <span
            className={`w-10 h-10 rounded-full ${
              isRecording ? 'bg-white' : 'bg-red-500'
            }`}
          ></span>
        </button>
        <p className="text-sm text-gray-600">
          {isRecording ? 'Recording...' : 'Hold to Talk'}
        </p>
      </div>
      <div className="text-center text-gray-500 text-sm">
        <p>
          <strong>Push to Talk:</strong> Adds audio streams to the conversation
          context. Once you release the button, it commits the audio buffer and
          explicitly requests the assistant to generate a response.
        </p>
      </div>
    </div>
  );
};

export default PushToTalk;
