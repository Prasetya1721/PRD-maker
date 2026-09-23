"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Search,
  BookOpen,
  FileCode,
  Download,
  FolderGit2,
} from "lucide-react";
import type { WikiCategory, WikiSectionItem } from "@/lib/workspace-generator";

interface WikiViewProps {
  projectSlug: string;
  projectName: string;
  wiki: WikiCategory[];
  onOpenRoadmap: () => void;
}

export default function WikiView({
  projectSlug,
  projectName,
  wiki,
  onOpenRoadmap,
}: WikiViewProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    wiki[0]?.id || "repo-overview"
  );
  const [activeItemId, setActiveItemId] = useState<string>(
    wiki[0]?.items[0]?.id || "tujuan-repository"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [copiedSectionId, setCopiedSectionId] = useState<string | null>(null);
  const [indexed, setIndexed] = useState(false);

  const activeCategory =
    wiki.find((c) => c.id === activeCategoryId) || wiki[0];

  const handleCopySection = async (item: WikiSectionItem) => {
    const textToCopy = `### ${item.title}\n\n${item.content}`;
    await navigator.clipboard.writeText(textToCopy);
    setCopiedSectionId(item.id);
    setTimeout(() => setCopiedSectionId(null), 2000);
  };

  const handleCopyAllWiki = async () => {
    const allText = wiki
      .map(
        (cat) =>
          `# ${cat.title}\n\n` +
          cat.items.map((it) => `## ${it.title}\n\n${it.content}`).join("\n\n")
      )
      .join("\n\n---\n\n");
    await navigator.clipboard.writeText(allText);
    setCopiedSectionId("all-wiki");
    setTimeout(() => setCopiedSectionId(null), 2000);
  };

  const handleDownloadWiki = () => {
    const allText = wiki
      .map(
        (cat) =>
          `# ${cat.title}\n\n` +
          cat.items.map((it) => `## ${it.title}\n\n${it.content}`).join("\n\n")
      )
      .join("\n\n---\n\n");
    const blob = new Blob([allText], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectSlug.replace(/[^a-zA-Z0-9_-]/g, "_")}-wiki.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredWiki = wiki
    .map((category) => ({
      ...category,
      items: category.items.filter(
        (it) =>
          it.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          it.content.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    }))
    .filter((category) => category.items.length > 0);

  return (
    <div className="flex flex-col min-h-[720px] rounded-2xl overflow-hidden border border-[oklch(0.22_0.03_265)] bg-[#0d1219] shadow-2xl">
      {/* ── Top Bar Header (Identical to ngodingpakeai) ── */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-[oklch(0.20_0.025_265)] bg-[#0f141d]/90 backdrop-blur-md">
        <div className="flex items-center gap-2 text-sm text-[oklch(0.65_0.03_265)]">
          <span className="font-semibold text-[oklch(0.88_0.02_265)] tracking-wide">
            ngodingpake<span className="text-[oklch(0.70_0.20_35)]">ai</span>
          </span>
          <span className="text-[oklch(0.35_0.02_265)]">·</span>
          <div className="flex items-center gap-1.5 font-mono text-xs text-[oklch(0.80_0.02_265)]">
            <FolderGit2 className="w-3.5 h-3.5 text-[oklch(0.65_0.18_170)]" />
            <span className="text-[oklch(0.65_0.03_265)]">{projectSlug}</span>
            <span className="text-[oklch(0.40_0.02_265)]">/</span>
            <span className="text-[oklch(0.75_0.15_45)] font-medium">Baseline Codebase #1</span>
            <span className="text-[oklch(0.40_0.02_265)]">/</span>
            <span className="text-[oklch(0.92_0.01_265)] font-semibold">Wiki</span>
          </div>
        </div>

        {/* Top-right action: 📖 Roadmap button */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpenRoadmap}
            className="group flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[oklch(0.85_0.03_265)] bg-[#17202d] hover:bg-[#202b3c] border border-[oklch(0.28_0.03_265)] hover:border-[oklch(0.40_0.05_265)] transition-all shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5 text-[oklch(0.70_0.16_60)] group-hover:scale-110 transition-transform" />
            <span>📖 Roadmap</span>
          </button>

          <button
            onClick={handleCopyAllWiki}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[oklch(0.70_0.03_265)] hover:text-white bg-[#141b24] hover:bg-[#1a2330] border border-[oklch(0.22_0.025_265)] transition-all"
            title="Salin seluruh Wiki"
          >
            {copiedSectionId === "all-wiki" ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Tersalin!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin Semua</span>
              </>
            )}
          </button>

          <button
            onClick={handleDownloadWiki}
            className="p-1.5 rounded-lg text-[oklch(0.65_0.03_265)] hover:text-white bg-[#141b24] hover:bg-[#1a2330] border border-[oklch(0.22_0.025_265)] transition-all"
            title="Download Wiki (.md)"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>
      {/* ── Main Workspace Body ── */}
      <div className="flex flex-1 relative overflow-hidden">
        {/* Left Sidebar */}
        <aside
          className={`shrink-0 border-r border-[oklch(0.18_0.025_265)] bg-[#0b0f15] transition-all duration-300 flex flex-col ${
            isSidebarOpen ? "w-64 sm:w-72" : "w-12"
          }`}
        >
          {isSidebarOpen ? (
            <div className="flex flex-col h-full p-4 overflow-y-auto custom-scrollbar">
              {/* Sidebar Header */}
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-[oklch(0.16_0.02_265)]">
                <div>
                  <h3 className="text-xs font-bold text-[oklch(0.92_0.01_265)] uppercase tracking-wider">
                    Dokumentasi
                  </h3>
                  <button
                    onClick={() => setIndexed(!indexed)}
                    className="flex items-center gap-1.5 text-[11px] text-[oklch(0.55_0.04_265)] hover:text-[oklch(0.75_0.08_265)] mt-0.5 transition-colors cursor-pointer"
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        indexed ? "bg-emerald-400" : "bg-[oklch(0.65_0.18_35)]"
                      }`}
                    />
                    <span>{indexed ? "Status: Terindeks" : "Belum pernah diindeks"}</span>
                  </button>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 text-[oklch(0.55_0.03_265)] hover:text-white rounded-md hover:bg-[#151c27] transition-all"
                  title="Tutup Sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Search bar inside sidebar */}
              <div className="relative mb-4">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[oklch(0.45_0.03_265)]" />
                <input
                  type="text"
                  placeholder="Cari dokumentasi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs bg-[#121822] border border-[oklch(0.20_0.025_265)] text-[oklch(0.85_0.02_265)] placeholder-[oklch(0.45_0.03_265)] focus:outline-none focus:border-[oklch(0.50_0.15_290)] transition-all"
                />
              </div>
              {/* Navigation tree */}
              <nav className="space-y-4">
                {(searchQuery ? filteredWiki : wiki).map((category) => {
                  const isCatActive = activeCategoryId === category.id;
                  return (
                    <div key={category.id} className="space-y-1">
                      {/* Category Header */}
                      <button
                        onClick={() => {
                          setActiveCategoryId(category.id);
                          if (category.items[0]) {
                            setActiveItemId(category.items[0].id);
                          }
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center justify-between ${
                          isCatActive
                            ? "bg-[#2b171a] text-[oklch(0.88_0.14_35)] border border-[oklch(0.45_0.15_35/0.3)] shadow-sm"
                            : "text-[oklch(0.70_0.03_265)] hover:text-[oklch(0.90_0.01_265)] hover:bg-[#131a24]"
                        }`}
                      >
                        <span className="truncate">{category.title}</span>
                      </button>

                      {/* Sub-items */}
                      <div className="pl-2 space-y-0.5 border-l border-[oklch(0.18_0.025_265)] ml-2">
                        {category.items.map((item) => {
                          const isItemActive =
                            isCatActive && activeItemId === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                setActiveCategoryId(category.id);
                                setActiveItemId(item.id);
                                const el = document.getElementById(item.id);
                                if (el) {
                                  el.scrollIntoView({ behavior: "smooth" });
                                }
                              }}
                              className={`w-full text-left px-2 py-1 rounded text-[11px] leading-tight transition-all truncate block ${
                                isItemActive
                                  ? "text-[oklch(0.92_0.01_265)] font-semibold bg-[#17202c]"
                                  : "text-[oklch(0.55_0.03_265)] hover:text-[oklch(0.80_0.02_265)] hover:bg-[#121822]"
                              }`}
                            >
                              {item.title}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </nav>
            </div>
          ) : (
            <div className="flex flex-col items-center py-4 gap-4">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-1.5 text-[oklch(0.55_0.03_265)] hover:text-white rounded-md hover:bg-[#151c27] transition-all"
                title="Buka Sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <div className="h-px w-6 bg-[oklch(0.20_0.02_265)]" />
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 text-[oklch(0.60_0.03_265)] hover:text-white hover:bg-[#151c27] rounded-lg transition-all"
                title="Dokumentasi"
              >
                <FileCode className="w-4 h-4" />
              </button>
            </div>
          )}
        </aside>
        {/* ── Main Content Area (Matches ngodingpakeai screenshot) ── */}
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-10 max-h-[720px] bg-[#0d1219]">
          <div className="max-w-3xl mx-auto space-y-10">
            {/* Title banner */}
            <div className="border-b border-[oklch(0.18_0.025_265)] pb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[oklch(0.95_0.01_265)] tracking-tight">
                {projectSlug} — {activeCategory.title}
              </h1>
              <p className="text-xs text-[oklch(0.48_0.03_265)] mt-2">
                Dokumentasi arsitektur baseline untuk <strong className="text-[oklch(0.80_0.02_265)]">{projectName}</strong> yang siap dieksekusi oleh AI coding agent.
              </p>
            </div>

            {/* Render Category Items */}
            {activeCategory.items.map((item) => (
              <section
                key={item.id}
                id={item.id}
                className="scroll-mt-6 p-5 sm:p-6 rounded-xl bg-[#111722]/80 border border-[oklch(0.18_0.025_265)] hover:border-[oklch(0.26_0.03_265)] transition-all relative group"
              >
                {/* Section title & quick copy */}
                <div className="flex items-center justify-between gap-3 mb-4 pb-2 border-b border-[oklch(0.16_0.02_265)]">
                  <h2 className="text-lg sm:text-xl font-bold text-[oklch(0.92_0.01_265)] flex items-center gap-2">
                    <span className="w-1.5 h-4 rounded-full bg-[oklch(0.65_0.20_35)]" />
                    {item.title}
                  </h2>
                  <button
                    onClick={() => handleCopySection(item)}
                    className="opacity-0 group-hover:opacity-100 flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium text-[oklch(0.70_0.03_265)] hover:text-white bg-[#18212e] hover:bg-[#202b3c] border border-[oklch(0.24_0.03_265)] transition-all cursor-pointer"
                  >
                    {copiedSectionId === item.id ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Tersalin</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Salin</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Render Markdown Content */}
                <div className="prose-prd text-sm text-[oklch(0.82_0.02_265)]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {item.content}
                  </ReactMarkdown>
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}



