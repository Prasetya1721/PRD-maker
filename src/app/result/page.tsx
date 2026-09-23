"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useIsClient } from "@/lib/useAiSettings";
import {
  buildDefaultRoadmap,
  buildDefaultWiki,
  extractProjectName,
  slugify,
  type WorkspaceData,
} from "@/lib/workspace-generator";
import WikiView from "@/components/workspace/WikiView";
import RoadmapView from "@/components/workspace/RoadmapView";
import ChatCodebaseView from "@/components/workspace/ChatCodebaseView";


/* ─── Tab config ─────────────────────────────────────────── */
const WORKSPACE_TABS = [
  { id: "wiki", label: "📚 Wiki Codebase", icon: "📚", highlight: true },
  { id: "roadmap", label: "📖 Task Roadmap", icon: "📖", highlight: true },
  { id: "chat", label: "💬 Chat Codebase", icon: "💬" },
  { id: "prd", label: "📋 Dokumen PRD", icon: "📋" },
  { id: "prompt", label: "🤖 Master Prompt", icon: "🤖" },
] as const;

type TabId = typeof WORKSPACE_TABS[number]["id"];

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
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer"
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

export default function ResultPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("wiki");
  const mounted = useIsClient();

  const [workspace] = useState<WorkspaceData | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = sessionStorage.getItem("prd_result");
      if (!stored) return null;
      const parsed = JSON.parse(stored);

      const prdMarkdown = parsed.prdMarkdown || "";
      const masterPrompt = parsed.masterPrompt || "";
      const idea = parsed.idea || "";
      const projectName =
        parsed.projectName || extractProjectName(idea, prdMarkdown);
      const cleanSlug = slugify(projectName);
      const projectSlug = parsed.projectSlug || `rafiulm/${cleanSlug}`;

      const wiki =
        parsed.wiki && Array.isArray(parsed.wiki) && parsed.wiki.length > 0
          ? parsed.wiki
          : buildDefaultWiki(projectName, projectSlug, idea, prdMarkdown);

      const roadmap =
        parsed.roadmap && Array.isArray(parsed.roadmap) && parsed.roadmap.length > 0
          ? parsed.roadmap
          : buildDefaultRoadmap(projectName, idea, prdMarkdown);

      return {
        projectName,
        projectSlug,
        idea,
        generatedAt: parsed.generatedAt || new Date().toISOString(),
        provider: parsed.provider,
        model: parsed.model,
        prdMarkdown,
        masterPrompt,
        wiki,
        roadmap,
      };
    } catch {
      return null;
    }
  });

  const hasResult = workspace !== null;

  /* Belum ada data setelah hydrate → kembalikan ke halaman utama */
  useEffect(() => {
    if (mounted && !hasResult) router.push("/");
  }, [mounted, hasResult, router]);

  if (!mounted || !workspace) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="flex justify-center gap-2 mb-4">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
          <p className="text-sm text-[oklch(0.50_0.04_265)]">Memuat workspace...</p>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(workspace.generatedAt).toLocaleString("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  });


  return (
    <div className="min-h-[85vh] px-4 py-8 max-w-6xl mx-auto animate-fade-in-up">
      {/* ─── Header ─────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <button
            onClick={() => router.push("/")}
            className="inline-flex items-center gap-1.5 text-xs text-[oklch(0.55_0.04_265)] hover:text-white transition-colors group cursor-pointer"
          >
            <span className="group-hover:-translate-x-1 transition-transform">←</span>
            Buat PRD Baru
          </button>

          {(workspace.provider || workspace.model) && (
            <span className="text-[11px] font-mono text-[oklch(0.60_0.06_290)] bg-[#121822] px-2.5 py-1 rounded-full border border-[oklch(0.22_0.03_265)]">
              🤖 {workspace.provider ?? "AI"}
              {workspace.model ? ` · ${workspace.model}` : ""}
            </span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-[oklch(0.95_0.01_265)] flex items-center gap-2">
              <span className="gradient-text">{workspace.projectName}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 font-mono">
                Baseline #1 Ready
              </span>
            </h1>
            <p className="text-xs text-[oklch(0.50_0.04_265)] line-clamp-2 max-w-2xl mt-1">
              📌 {workspace.idea}
            </p>
            <p className="text-[11px] text-[oklch(0.40_0.04_265)] mt-1">
              Dibuat pada {formattedDate}
            </p>
          </div>

          {/* Quick Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <CopyButton
              text={
                activeTab === "prd"
                  ? workspace.prdMarkdown
                  : activeTab === "prompt"
                  ? workspace.masterPrompt
                  : JSON.stringify(workspace, null, 2)
              }
              label="Copy Aktif"
            />
            <button
              onClick={() =>
                downloadFile(
                  workspace.prdMarkdown,
                  `${workspace.projectSlug.replace(/[^a-zA-Z0-9_-]/g, "_")}-prd.md`,
                  "text/markdown"
                )
              }
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[oklch(0.70_0.03_265)] hover:text-white bg-[#141b24] hover:bg-[#1a2330] border border-[oklch(0.22_0.025_265)] transition-all cursor-pointer"
            >
              ↓ PRD (.md)
            </button>
          </div>
        </div>
      </div>

      {/* ─── Navigation Workspace Tabs ───────────────────── */}
      <div className="flex flex-wrap gap-2 mb-6 p-1.5 rounded-xl w-fit bg-[#0f141d] border border-[oklch(0.20_0.025_265)]">
        {WORKSPACE_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? "bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-lg shadow-rose-950/40"
                  : "text-[oklch(0.60_0.03_265)] hover:text-white hover:bg-[#151c27]"
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─── Tab Content ─────────────────────────────────── */}
      <div key={activeTab} className="animate-fade-in">
        {activeTab === "wiki" && (
          <WikiView
            projectName={workspace.projectName}
            projectSlug={workspace.projectSlug}
            wiki={workspace.wiki}
            onOpenRoadmap={() => setActiveTab("roadmap")}
          />
        )}

        {activeTab === "roadmap" && (
          <RoadmapView
            projectName={workspace.projectName}
            projectSlug={workspace.projectSlug}
            roadmap={workspace.roadmap}
            onBackToWiki={() => setActiveTab("wiki")}
          />
        )}

        {activeTab === "chat" && (
          <ChatCodebaseView
            projectName={workspace.projectName}
            projectSlug={workspace.projectSlug}
            idea={workspace.idea}
            prdMarkdown={workspace.prdMarkdown}
          />
        )}

        {activeTab === "prd" && (
          <div className="glass-card rounded-2xl p-8 border border-[oklch(0.22_0.03_265)] bg-[#0d1219]">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[oklch(0.18_0.025_265)]">
              <div>
                <h2 className="text-xl font-bold text-white">Dokumen PRD Lengkap</h2>
                <p className="text-xs text-[oklch(0.50_0.04_265)] mt-1">
                  Executive summary, fitur kunci, user stories, dan arsitektur bisnis
                </p>
              </div>
              <CopyButton text={workspace.prdMarkdown} label="Salin Dokumen PRD" />
            </div>
            <div className="prose-prd">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {workspace.prdMarkdown}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {activeTab === "prompt" && (
          <div className="glass-card rounded-2xl p-8 border border-[oklch(0.22_0.03_265)] bg-[#0d1219]">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-[oklch(0.18_0.025_265)]">
              <div>
                <h2 className="text-xl font-bold text-white">Master Dev Prompt</h2>
                <p className="text-xs text-[oklch(0.50_0.04_265)] mt-1">
                  Prompt lengkap untuk diumpankan ke AI Coding Agent (Cursor, Claude Code, Windsurf, Copilot)
                </p>
              </div>
              <CopyButton text={workspace.masterPrompt} label="Salin Master Prompt" />
            </div>
            <pre className="p-4 rounded-xl bg-[#080c12] border border-[oklch(0.20_0.025_265)] whitespace-pre-wrap text-xs leading-relaxed font-mono text-[oklch(0.85_0.04_170)] max-h-[70vh] overflow-auto custom-scrollbar">
              {workspace.masterPrompt}
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
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold transition-all duration-200 text-white bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 shadow-lg shadow-rose-950/30 cursor-pointer"
        >
          ✨ Generate Workspace / PRD Baru
        </button>
      </div>
    </div>
  );
}
