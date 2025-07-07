'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Live Chat', icon: '💬' },
    { href: '/live-transcription', label: 'Live Transcription', icon: '🎤' },
  ];

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-purple-600 shadow-lg">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">
            OpenAI Realtime WebRTC
          </h1>

          <div className="flex gap-6">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-6 py-3 rounded-lg font-semibold text-lg transition-all duration-200 transform hover:scale-105
                    ${
                      isActive
                        ? 'bg-white text-blue-600 shadow-md'
                        : 'text-white hover:bg-white/10'
                    }
                  `}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
