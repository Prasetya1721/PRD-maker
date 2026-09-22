"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/* ─── Types ─────────────────────────────────────────────── */
interface PRDResult {
  prdMarkdown: string;
  masterPrompt: string;
  idea: string;
  generatedAt: string;
}

/* ─── Tab config ─────────────────────────────────────────── */
const TABS = [
  { id: "prd", label: "📋 PRD Document", icon: "📋" },
  { id: "prompt", label: "🤖 Master Dev Prompt", icon: "🤖" },
] as const;
type TabId = typeof TABS[number]["id"];

/* ─── Copy button ────────────────────────────────────────── */
function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
      style={{
        background: copied
          ? "oklch(0.45 0.18 170 / 0.2)"
          : "oklch(0.65 0.22 290 / 0.12)",
        color: copied
          ? "oklch(0.65 0.18 170)"
          : "oklch(0.70 0.15 290)",
        border: copied
          ? "1px solid oklch(0.45 0.18 170 / 0.35)"
          : "1px solid oklch(0.65 0.22 290 / 0.25)",
      }}
    >
      {copied ? "✓ Tersalin!" : `⎘ ${label}`}
    </button>
  );
}

/* ─── Download helper ────────────────────────────────────── */
function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ─── Main component ─────────────────────────────────────── */
export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<PRDResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>("prd");
  const [mounted, setMounted] = useState(false);

  /* Load from sessionStorage on mount */
  useEffect(() => {
    const stored = sessionStorage.getItem("prd_result");
    if (stored) {
      try {
        setResult(JSON.parse(stored));
      } catch {
        router.push("/");
      }
    } else {
      router.push("/");
    }
    setMounted(true);
  }, [router]);

  if (!mounted || !result) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="flex justify-center gap-2 mb-4">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
          <p className="text-sm text-[oklch(0.50_0.04_265)]">Memuat hasil...</p>
        </div>
      </div>
    );
  }

  const activeContent = activeTab === "prd" ? result.prdMarkdown : result.masterPrompt;
  const filename = activeTab === "prd" ? "PRD-Genius-PRD.md" : "PRD-Genius-Master-Prompt.md";
  const formattedDate = new Date(result.generatedAt).toLocaleString("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  });

  return (
    <div className="min-h-[85vh] px-4 py-10 max-w-5xl mx-auto animate-fade-in-up">

      {/* ─── Header ─────────────────────────────────────── */}
      <div className="mb-8">
        <button
          onClick={() => router.push("/")}
          className="inline-flex items-center gap-1.5 text-sm text-[oklch(0.55_0.04_265)] hover:text-[oklch(0.75_0.08_265)] transition-colors mb-6 group"
        >
          <span className="group-hover:-translate-x-1 transition-transform">←</span>
          Buat PRD Baru
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black gradient-text mb-2">
              PRD Siap! 🎉
            </h1>
            <p className="text-sm text-[oklch(0.45_0.04_265)] line-clamp-2 max-w-xl">
              📌 {result.idea.slice(0, 120)}{result.idea.length > 120 ? "..." : ""}
            </p>
            <p className="text-xs text-[oklch(0.38_0.04_265)] mt-1">
              Generated {formattedDate}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <CopyButton text={activeContent} label="Copy Tab Aktif" />
            <button
              onClick={() => downloadFile(activeContent, filename, "text/markdown")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
              style={{
                background: "oklch(0.16 0.03 265)",
                color: "oklch(0.65 0.04 265)",
                border: "1px solid oklch(0.22 0.03 265)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.20 0.04 265)";
                (e.currentTarget as HTMLButtonElement).style.color = "oklch(0.80 0.04 265)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.16 0.03 265)";
                (e.currentTarget as HTMLButtonElement).style.color = "oklch(0.65 0.04 265)";
              }}
            >
              ↓ Download .md
            </button>
          </div>
        </div>
      </div>

      {/* ─── Tabs ───────────────────────────────────────── */}
      <div className="flex gap-2 mb-6 p-1 rounded-xl w-fit"
        style={{ background: "oklch(0.11 0.025 265)" }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200"
            style={
              activeTab === tab.id
                ? {
                    background: "linear-gradient(135deg, oklch(0.65 0.22 290), oklch(0.55 0.22 230))",
                    color: "white",
                    boxShadow: "0 0 20px oklch(0.65 0.22 290 / 0.35)",
                  }
                : {
                    background: "transparent",
                    color: "oklch(0.55 0.04 265)",
                  }
            }
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                (e.currentTarget as HTMLButtonElement).style.color = "oklch(0.80 0.04 265)";
                (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.16 0.03 265)";
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                (e.currentTarget as HTMLButtonElement).style.color = "oklch(0.55 0.04 265)";
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── Content card ───────────────────────────────── */}
      <div
        key={activeTab}
        className="glass-card rounded-2xl p-8 animate-scale-in custom-scrollbar"
        style={{ minHeight: "500px" }}
      >
        {activeTab === "prd" ? (
          /* ── Rendered Markdown ── */
          <div className="prose-prd">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {result.prdMarkdown}
            </ReactMarkdown>
          </div>
        ) : (
          /* ── Master Prompt (monospace) ── */
          <div>
            {/* Copy button inside */}
            <div className="flex justify-between items-center mb-4">
              <span className="text-xs font-semibold text-[oklch(0.50_0.08_290)] uppercase tracking-wider">
                Master Dev Prompt
              </span>
              <CopyButton text={result.masterPrompt} label="Copy Semua" />
            </div>
            <pre
              className="whitespace-pre-wrap text-sm leading-relaxed custom-scrollbar overflow-auto"
              style={{
                fontFamily: "var(--font-geist-mono), 'Fira Code', monospace",
                color: "oklch(0.82 0.05 265)",
                maxHeight: "70vh",
              }}
            >
              {result.masterPrompt}
            </pre>
          </div>
        )}
      </div>

      {/* ─── Footer CTA ─────────────────────────────────── */}
      <div className="mt-8 text-center">
        <button
          onClick={() => {
            sessionStorage.removeItem("prd_result");
            router.push("/");
          }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-200"
          style={{
            background: "linear-gradient(135deg, oklch(0.65 0.22 290), oklch(0.55 0.22 230))",
            color: "white",
            boxShadow: "0 0 25px oklch(0.65 0.22 290 / 0.30)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 0 40px oklch(0.65 0.22 290 / 0.50)";
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 0 25px oklch(0.65 0.22 290 / 0.30)";
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
          }}
        >
          ✨ Generate PRD Baru
        </button>
      </div>
    </div>
  );
}
