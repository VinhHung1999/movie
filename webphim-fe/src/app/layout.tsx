import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'WebPhim - Watch Movies & TV Shows Online',
  description: 'Stream unlimited movies and TV shows on WebPhim.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-netflix-black text-netflix-white antialiased`}>
        {children}
      </body>
    </html>
  );
}
