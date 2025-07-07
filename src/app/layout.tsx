'use client';

import './globals.css';
import { Navbar } from '@/components/Navbar';

// Keep the RootLayout as a server component
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`antialiased`}>
        <Navbar />
        <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          {children}
        </main>
      </body>
    </html>
  );
}
