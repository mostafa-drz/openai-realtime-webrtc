'use client';

import React, { useEffect, useRef } from 'react';

interface WebRTCPlayerProps {
  remoteStream: MediaStream | null;
  isMuted: boolean;
  onMute: () => void;
  onUnmute: () => void;
}

const WebRTCPlayer: React.FC<WebRTCPlayerProps> = ({
  remoteStream,
  isMuted,
  onMute,
  onUnmute,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (audioRef.current && remoteStream) {
      // Attach the stream to the audio element
      audioRef.current.srcObject = remoteStream;

      // Set up the AudioContext and visualization
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(remoteStream);
      const analyser = audioContext.createAnalyser();
      source.connect(analyser);

      // Configure the analyser
      analyser.fftSize = 128; // Lower FFT size for smoother visualization
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      // Get canvas context for drawing
      const canvas = canvasRef.current;
      const canvasContext = canvas?.getContext('2d');
      if (!canvas || !canvasContext) return;

      // Set canvas size
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      // Draw function
      const draw = () => {
        requestAnimationFrame(draw);

        analyser.getByteFrequencyData(dataArray);

        // Clear canvas
        canvasContext.clearRect(0, 0, canvas.width, canvas.height);

        // Draw bars with calming colors
        const barWidth = (canvas.width / bufferLength) * 4; // Wider bars
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i];

          canvasContext.fillStyle = `hsl(${i * 12}, 70%, 60%)`; // Calming gradient
          canvasContext.fillRect(
            x,
            canvas.height - barHeight / 1.5,
            barWidth - 2, // Add spacing between bars
            barHeight / 1.5
          );

          x += barWidth;
        }
      };

      draw();

      // Cleanup on unmount
      return () => {
        audioContext.close();
      };
    }
  }, [remoteStream]);

  const handleMuteClick = () => {
    if (isMuted) {
      onUnmute();
    } else {
      onMute();
    }
  };

  if (!remoteStream) {
    return null;
  }

  return (
    <div>
      <audio ref={audioRef} autoPlay controls={false} muted={isMuted} />
      <canvas ref={canvasRef} className="w-full h-64 border rounded shadow" />
      <button
        onClick={handleMuteClick}
        className="mt-2 p-2 bg-blue-500 text-white rounded"
      >
        {isMuted ? 'Unmute' : 'Mute'}
      </button>
    </div>
  );
};

export default WebRTCPlayer;
