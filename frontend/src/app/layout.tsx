import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/sidebar';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Bluesky Pro Bot',
  description: 'Advanced Automation Dashboard',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-background text-foreground antialiased`}>
          <div className="flex h-screen overflow-hidden">
            {/* Sidebar Area */}
            <aside className="w-72 flex-shrink-0 border-r border-border bg-card/60 backdrop-blur">
              <Sidebar />
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto px-8 py-6">
              {children}
            </main>
          </div>
      </body>
    </html>
  );
}
