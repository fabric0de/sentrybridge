import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "sonner";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Sentry to Slack - Webhook Generator",
  description:
    "Connect your Sentry alerts to Slack with customizable message formats. Easy setup, secure, and reliable webhook integration.",
  keywords: [
    "sentry",
    "slack",
    "webhook",
    "alerts",
    "error tracking",
    "notifications",
  ],
  authors: [{ name: "Fabric0de" }],
  openGraph: {
    title: "Sentry to Slack - Webhook Generator",
    description:
      "Connect your Sentry alerts to Slack with customizable message formats",
    url: "https://slack-webhook-in-sentry.vercel.app",
    siteName: "Sentry to Slack",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sentry to Slack - Webhook Generator",
    description:
      "Connect your Sentry alerts to Slack with customizable message formats",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <main>{children}</main>
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            duration: 3000,
            className: "font-medium",
          }}
        />
      </body>
    </html>
  );
}
