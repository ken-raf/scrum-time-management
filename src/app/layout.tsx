import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getMessages } from 'next-intl/server';
import { defaultLocale } from '@/i18n/request';
import { ClientIntlProvider } from '@/components/ClientIntlProvider';
import { ThemeProvider } from '@/contexts/ThemeContext';
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Daily Scrum Time Management",
  description: "Gérez efficacement le temps de parole lors de vos réunions Daily Scrum",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get messages for the default locale (French)
  const messages = await getMessages({ locale: defaultLocale });

  return (
    <html lang={defaultLocale}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <ClientIntlProvider initialMessages={messages} initialLocale={defaultLocale}>
            {children}
          </ClientIntlProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
