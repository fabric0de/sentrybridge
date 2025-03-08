import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "sonner";
import { siteMetadata } from "./metadata";

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

export const metadata = siteMetadata;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
