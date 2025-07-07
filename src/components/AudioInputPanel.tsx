import React, { useRef, useState } from 'react';

interface AudioInputPanelProps {
  onAudioReady: (audioBlob: Blob, filename: string) => void;
  accept?: string;
  disabled?: boolean;
}

export const AudioInputPanel: React.FC<AudioInputPanelProps> = ({
  onAudioReady,
  accept = '.wav,audio/wav,audio/x-wav',
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recorder, setRecorder] = useState<MediaRecorder | null>(null);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    onAudioReady(file, file.name);
    e.target.value = '';
  };

  // Handle push-to-talk recording
  const handleRecordStart = async () => {
    setRecordingError(null);
    setRecordedBlob(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm',
      });
      const chunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setRecordedBlob(blob);
        onAudioReady(blob, `recording-${Date.now()}.webm`);
        stream.getTracks().forEach((track) => track.stop());
      };
      setRecorder(mediaRecorder);
      setIsRecording(true);
      mediaRecorder.start();
    } catch (err) {
      setRecordingError('Could not access microphone.');
      setIsRecording(false);
    }
  };

  const handleRecordStop = () => {
    if (recorder && isRecording) {
      recorder.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* File Upload */}
      <button
        type="button"
        className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isRecording}
      >
        Upload WAV File
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled || isRecording}
      />
      {/* Push-to-Talk Walkie-Talkie */}
      <button
        type="button"
        className={`px-6 py-3 rounded-full font-bold text-white transition-colors shadow-lg ${
          isRecording
            ? 'bg-red-600 animate-pulse'
            : 'bg-blue-600 hover:bg-blue-700'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        onMouseDown={handleRecordStart}
        onMouseUp={handleRecordStop}
        onMouseLeave={handleRecordStop}
        onTouchStart={handleRecordStart}
        onTouchEnd={handleRecordStop}
        disabled={disabled}
        aria-pressed={isRecording}
      >
        {isRecording ? 'Recording... Release to Stop' : 'Hold to Record'}
      </button>
      {recordingError && (
        <div className="text-red-600 text-sm mt-2">{recordingError}</div>
      )}
      {recordedBlob && !isRecording && (
        <audio
          controls
          src={URL.createObjectURL(recordedBlob)}
          className="mt-2"
        />
      )}
      <div className="text-xs text-slate-500 mt-2 text-center">
        Only mono PCM16 .wav files at 24kHz are supported for upload.
        <br />
        Push-to-talk uses browser recording (WebM/Opus).
        <br />
        For production, convert to PCM16 before sending to OpenAI.
      </div>
    </div>
  );
};
