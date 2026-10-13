import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#08090B",
};

export const metadata: Metadata = {
  title: "BeastMQ ",
  description:
    "PostgreSQL-backed high-performance message queue, distributed task orchestration engine, and turn-timeout shield for AI agents. Zero Redis, strict ACID durability.",
  keywords: [
    "message queue",
    "distributed systems",
    "PostgreSQL",
    "SKIP LOCKED",
    "AI agent orchestrator",
    "task queue",
    "event streaming",
    "beastmq",
    "skills.sh",
  ],
  authors: [{ name: "Abhinav Bist" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#08090B] text-[#F3F4F6] selection:bg-[#00FF66] selection:text-[#08090B]">
        {children}
      </body>
    </html>
  );
}
