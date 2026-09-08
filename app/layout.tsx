import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://somus-flow.wca.chatgpt.site'),
  title: 'Synky Sales · CRM e Propostas',
  description: 'Gestão comercial e propostas para escritórios de arquitetura.',
  openGraph: {
    title: 'Synky Sales · CRM e Propostas',
    description: 'Gestão comercial e propostas para escritórios de arquitetura.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Somus Flow — CRM e propostas para arquitetura' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Synky Sales · CRM e Propostas',
    description: 'Gestão comercial e propostas para escritórios de arquitetura.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
