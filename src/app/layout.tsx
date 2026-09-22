import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import NavLoginButton from "@/components/NavLoginButton";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PRD-Genius | AI-Powered Product Requirements Generator",
  description:
    "Transform your raw idea into a complete PRD and Master Dev Prompt using AI. Built for founders, PMs, and developers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} h-full dark`}
    >
      <body className="min-h-full flex flex-col antialiased" style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Background orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(oklch(0.65 0.22 290) 1px, transparent 1px), linear-gradient(90deg, oklch(0.65 0.22 290) 1px, transparent 1px)",
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        {/* Navbar */}
        <nav className="relative z-50 glass border-b border-[oklch(0.30_0.05_290_/_0.25)] sticky top-0">
          <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
            <a href="/" className="flex items-center gap-2.5 group">
              {/* Logo icon */}
              <div className="w-8 h-8 rounded-lg flex items-center justify-center animate-pulse-glow"
                style={{ background: "linear-gradient(135deg, oklch(0.65 0.22 290), oklch(0.55 0.22 230))" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 3H7V7H3V3Z" fill="white" fillOpacity="0.9"/>
                  <path d="M9 3H13V7H9V3Z" fill="white" fillOpacity="0.6"/>
                  <path d="M3 9H7V13H3V9Z" fill="white" fillOpacity="0.6"/>
                  <path d="M9 9H13V13H9V9Z" fill="white" fillOpacity="0.9"/>
                </svg>
              </div>
              <span className="text-xl font-bold gradient-text">PRD-Genius</span>
            </a>

            <div className="flex items-center gap-3">
              <span className="hidden sm:flex items-center gap-1.5 text-xs text-[oklch(0.55_0.04_265)] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                AI Ready
              </span>
              <NavLoginButton />
            </div>
          </div>
        </nav>

        <main className="flex-1 relative z-10">{children}</main>

        <footer className="relative z-10 glass border-t border-[oklch(0.22_0.03_265)] py-5 text-center text-sm text-[oklch(0.40_0.04_265)]">
          <p>
            © 2026{" "}
            <span className="gradient-text font-semibold">PRD-Genius</span>
            {" · "}Powered by GPT-4o · All rights reserved.
          </p>
        </footer>
      </body>
    </html>
  );
}
