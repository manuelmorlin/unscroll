import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Unscroll - End the Endless Scrolling',
  description: 'A decision-making app for your watchlist. Stop scrolling, start watching.',
  keywords: ['movies', 'tv shows', 'watchlist', 'decision maker', 'entertainment'],
  authors: [{ name: 'Manuel Morlin' }],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Unscroll',
  },
  formatDetection: {
    telephone: false,
  },
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
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/icon.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icon.png" />
      </head>
      <body className={`${inter.className} antialiased min-h-screen bg-zinc-950`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
