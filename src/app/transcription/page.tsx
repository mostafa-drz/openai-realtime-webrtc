import { VoiceTranscriptionDemo } from '@/components/VoiceTranscriptionDemo';
import Link from 'next/link';

export default function TranscriptionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Voice Transcription Demo
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-8">
            Upload audio files and get instant transcriptions using
            OpenAI&apos;s Realtime API. Simple, elegant, and powerful
            voice-to-text conversion.
          </p>

          {/* Navigation */}
          <div className="flex justify-center gap-4 mb-8">
            <Link
              href="/"
              className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-medium"
            >
              Live Chat Demo
            </Link>
            <Link
              href="/transcription"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Voice Transcription
            </Link>
          </div>
        </header>

        <VoiceTranscriptionDemo />
      </div>
    </div>
  );
}
