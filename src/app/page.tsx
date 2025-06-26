import { RealtimeDemo } from '@/components/RealtimeDemo';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            OpenAI Realtime WebRTC Demo
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            A comprehensive demo showcasing real-time voice conversations with
            AI using WebRTC technology. Built with Next.js 15 and TypeScript.
          </p>
        </header>

        <RealtimeDemo />
      </div>
    </div>
  );
}
