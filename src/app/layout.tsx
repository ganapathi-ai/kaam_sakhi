import type { Metadata } from 'next';
import './globals.css';
import NavBar from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'KaamSakhi — AI Menstrual Workday Predictor',
  description:
    'KaamSakhi helps women informal workers anticipate high-disruption menstrual workdays and prepare in advance, using a simple AI prediction model. Not a diagnostic tool.',
  keywords: ['women health', 'informal workers', 'menstrual prediction', 'AI', 'KaamSakhi'],
  openGraph: {
    title: 'KaamSakhi — Know your difficult days. Plan your work.',
    description:
      'A lightweight AI companion for women informal workers — predicts potentially difficult menstrual workdays to help you prepare early.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        <main className="page-wrapper">
          {children}
        </main>
      </body>
    </html>
  );
}
