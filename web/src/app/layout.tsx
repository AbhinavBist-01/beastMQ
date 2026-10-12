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
  title: "BeastMQ — Move Events at Beast Speed | Agent-Native Task Queue & Distributed Streaming",
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
  authors: [{ name: "BeastMQ Team" }],
  viewport: "width=device-width, initial-scale=1, maximum-scale=5",
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
