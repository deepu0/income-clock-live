import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Real-Time Earnings Calculator',
  description: 'Track your salary and earnings in real-time, from seconds to years. Calculate your income per second, minute, hour, day, and month.',
  keywords: 'salary calculator, earnings tracker, real-time calculator, income tracker, salary tracking',
  authors: [{ name: 'Real-Time Earnings Calculator' }],
  openGraph: {
    title: 'Real-Time Earnings Calculator',
    description: 'Track your salary and earnings in real-time, from seconds to years',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Real-Time Earnings Calculator',
    description: 'Track your salary and earnings in real-time, from seconds to years',
  },
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="canonical" href="https://earnings-calculator.com" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}