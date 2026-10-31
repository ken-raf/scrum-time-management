import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { getMessages } from 'next-intl/server';
import { defaultLocale } from '@/i18n/request';
import { ClientIntlProvider } from '@/components/ClientIntlProvider';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { PwaRegister } from '@/components/PwaRegister';
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
  applicationName: "Daily Scrum",
  icons: {
    icon: [
      { url: "/icons/icon.svg", type: "image/svg+xml" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "Daily Scrum",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: "#06080f",
  colorScheme: "dark",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages({ locale: defaultLocale });

  return (
    <html lang={defaultLocale} className={`dark ${geistSans.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <ThemeProvider>
          <ClientIntlProvider initialMessages={messages} initialLocale={defaultLocale}>
            {children}
          </ClientIntlProvider>
        </ThemeProvider>
        <PwaRegister />
      </body>
    </html>
  );
}
