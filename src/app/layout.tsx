import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Unscroll - End the Endless Scrolling',
  description: 'A decision-making app for your watchlist. Stop scrolling, start watching.',
  keywords: ['movies', 'tv shows', 'watchlist', 'decision maker', 'entertainment'],
  authors: [{ name: 'Your Name' }],
  openGraph: {
    title: 'Unscroll',
    description: 'End the endless scrolling. Let fate decide what you watch next.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  themeColor: '#09090b',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased min-h-screen bg-zinc-950`}>
        {children}
      </body>
    </html>
  );
}
