import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { LoginModalProvider } from '@/components/LoginModalContext';
import { CartProvider } from '@/components/CartContext';
import { ReactNode } from 'react';
import ChatWidget from '@/components/ChatWidget';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GangaFarma | Tu farmacia de confianza',
  description: 'Farmacia Online - Encuentra todo en medicina.',
};

export function CoreProviders({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <LoginModalProvider>
        <CartProvider>
          {children}
          <ChatWidget />
        </CartProvider>
      </LoginModalProvider>
    </Providers>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="light">
      <body className={`${inter.className} bg-background-light text-slate-900 min-h-screen flex flex-col`}>
        <CoreProviders>
          {children}
        </CoreProviders>
      </body>
    </html>
  );
}
