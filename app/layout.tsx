import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Blunder Check — AI Information Gap Detection",
  description:
    "Research like a chess engine: find what the sources are NOT telling you. Detect conflicting claims, information dark spots, and evaluate decision safety.",
  openGraph: {
    title: "Blunder Check — AI Information Gap Detection",
    description:
      "Find what the sources aren't telling you. AI-assisted gap detection with programmatic quote verification and deterministic scoring.",
    type: "website",
    siteName: "Blunder Check",
  },
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark antialiased`}
    >
      <body className="min-h-screen flex flex-col bg-bg text-text">
        {children}
      </body>
    </html>
  );
}
