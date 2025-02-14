import type { Metadata } from 'next';
import './globals.css';
import { OpenAIRealtimeWebRTCProvider } from './context/OpenAIRealtimeWebRTC';

export const metadata: Metadata = {
  title: 'OpenAI Realtime WebRTC',
  description: 'OpenAI Realtime WebRTC',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        <OpenAIRealtimeWebRTCProvider>{children}</OpenAIRealtimeWebRTCProvider>
      </body>
    </html>
  );
}
