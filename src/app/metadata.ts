import { Metadata } from "next";

export const siteMetadata: Metadata = {
  metadataBase: new URL("https://sentrybridge.xyz"),
  title: {
    default: "SentryBridge - Sentry to Slack Notifications",
    template: "%s | SentryBridge",
  },
  description:
    "Bridge between Sentry and Slack for real-time error notifications",
  keywords: [
    "sentry",
    "slack",
    "webhook",
    "notifications",
    "error tracking",
    "monitoring",
  ],
  authors: [{ name: "JUNGHYOEN KIM" }],
  creator: "JUNGHYOEN KIM",
  publisher: "SentryBridge",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://sentrybridge.xyz",
    title: "SentryBridge",
    description:
      "Bridge between Sentry and Slack for real-time error notifications",
    siteName: "SentryBridge",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "SentryBridge",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SentryBridge",
    description:
      "Bridge between Sentry and Slack for real-time error notifications",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32" },
      { url: "/favicon-16x16.png", sizes: "16x16" },
      { url: "/favicon-32x32.png", sizes: "32x32" },
      { url: "/icon.png", sizes: "512x512" },
    ],
    apple: [
      { url: "/apple-icon.png", sizes: "180x180" },
      { url: "/apple-icon-72x72.png", sizes: "72x72" },
      { url: "/apple-icon-114x114.png", sizes: "114x114" },
      { url: "/apple-icon-144x144.png", sizes: "144x144" },
    ],
    other: [
      { rel: "android-chrome", url: "/icon-192x192.png", sizes: "192x192" },
      { rel: "android-chrome", url: "/icon-384x384.png", sizes: "384x384" },
      { rel: "android-chrome", url: "/icon-512x512.png", sizes: "512x512" },
    ],
  },
};
