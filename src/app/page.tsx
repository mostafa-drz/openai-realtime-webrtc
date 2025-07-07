import { RealtimeDemo } from '@/components/RealtimeDemo';
import { InfoBanner } from '@/components/InfoBanner';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8">
      <InfoBanner />

      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          Live Chat Demo
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Real-time conversation with AI using WebRTC technology. Speak
          naturally and get instant responses from the AI assistant.
        </p>
      </div>

      <RealtimeDemo />
    </div>
  );
}
