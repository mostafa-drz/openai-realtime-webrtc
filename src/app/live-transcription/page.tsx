import { LiveTranscriptionDemo } from '@/components/LiveTranscriptionDemo';

export default function LiveTranscriptionPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          Live Transcription Demo
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Real-time voice-to-text transcription. Speak and see your words appear
          instantly on screen.
        </p>
      </div>

      <LiveTranscriptionDemo />
    </div>
  );
}
