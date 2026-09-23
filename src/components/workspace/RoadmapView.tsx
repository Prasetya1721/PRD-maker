"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Clock,
  Copy,
  Check,
  BookOpen,
  Download,
  FolderGit2,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { RoadmapTask } from "@/lib/workspace-generator";

interface RoadmapViewProps {
  projectSlug: string;
  projectName: string;
  roadmap: RoadmapTask[];
  onBackToWiki: () => void;
}

export default function RoadmapView({
  projectSlug,
  projectName,
  roadmap: initialRoadmap,
  onBackToWiki,
}: RoadmapViewProps) {
  const [tasks, setTasks] = useState<RoadmapTask[]>(initialRoadmap);
  const [selectedPhase, setSelectedPhase] = useState<string>("all");
  const [selectedStatus] = useState<string>("all");
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const toggleTaskStatus = (taskId: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const nextStatus =
          t.status === "todo"
            ? "in_progress"
            : t.status === "in_progress"
            ? "done"
            : "todo";
        return { ...t, status: nextStatus };
      })
    );
  };

  const copyTaskPrompt = async (task: RoadmapTask) => {
    await navigator.clipboard.writeText(task.agentPrompt);
    setCopiedTaskId(task.id);
    setTimeout(() => setCopiedTaskId(null), 2500);
  };

  const downloadRoadmapMd = () => {
    const content = `# Roadmap & Task AI Coding: ${projectName} (${projectSlug})\n\n` +
      tasks
        .map(
          (t, idx) =>
            `## Task ${idx + 1}: ${t.title} [${t.status.toUpperCase()}]\n` +
            `**Fase:** ${t.phaseTitle}\n` +
            `**Deskripsi:** ${t.description}\n` +
            `**File Terkait:** ${t.files.join(", ")}\n\n` +
            `### AI Agent Prompt:\n\`\`\`\n${t.agentPrompt}\n\`\`\`\n`
        )
        .join("\n---\n\n");

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectSlug.replace(/[^a-zA-Z0-9_-]/g, "_")}-roadmap.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const phases = Array.from(new Set(tasks.map((t) => t.phaseTitle)));

  const filteredTasks = tasks.filter((t) => {
    if (selectedPhase !== "all" && t.phaseTitle !== selectedPhase) return false;
    if (selectedStatus !== "all" && t.status !== selectedStatus) return false;
    return true;
  });

  const doneCount = tasks.filter((t) => t.status === "done").length;
  const progressPercent = Math.round((doneCount / (tasks.length || 1)) * 100);

  return (
    <div className="flex flex-col min-h-[720px] rounded-2xl overflow-hidden border border-[oklch(0.22_0.03_265)] bg-[#0d1219] shadow-2xl">
      {/* ── Top Bar Header ── */}
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
            <span className="text-[oklch(0.92_0.01_265)] font-semibold">Roadmap</span>
          </div>
        </div>

        {/* Back to Wiki & Download */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBackToWiki}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[oklch(0.85_0.03_265)] bg-[#17202d] hover:bg-[#202b3c] border border-[oklch(0.28_0.03_265)] transition-all cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-[oklch(0.70_0.16_60)]" />
            <span>📚 Buka Wiki</span>
          </button>

          <button
            onClick={downloadRoadmapMd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[oklch(0.70_0.03_265)] hover:text-white bg-[#141b24] hover:bg-[#1a2330] border border-[oklch(0.22_0.025_265)] transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Roadmap</span>
          </button>
        </div>
      </header>

      {/* ── Filter & Progress Bar ── */}
      <div className="px-6 py-4 border-b border-[oklch(0.18_0.025_265)] bg-[#101622]/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Progress status */}
        <div className="flex items-center gap-4">
          <div className="text-xs">
            <span className="text-[oklch(0.50_0.03_265)]">Progress Coding Agent: </span>
            <strong className="text-[oklch(0.92_0.01_265)] font-mono">
              {doneCount}/{tasks.length} ({progressPercent}%)
            </strong>
          </div>
          <div className="w-32 bg-[#17202d] h-2 rounded-full overflow-hidden border border-[oklch(0.25_0.03_265)]">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Phase selector tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSelectedPhase("all")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              selectedPhase === "all"
                ? "bg-[oklch(0.65_0.20_35)] text-white shadow-sm"
                : "text-[oklch(0.60_0.03_265)] hover:text-white bg-[#141b24]"
            }`}
          >
            Semua Fase
          </button>
          {phases.map((p, i) => (
            <button
              key={p}
              onClick={() => setSelectedPhase(p)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all truncate max-w-[160px] cursor-pointer ${
                selectedPhase === p
                  ? "bg-[oklch(0.65_0.20_35)] text-white shadow-sm"
                  : "text-[oklch(0.60_0.03_265)] hover:text-white bg-[#141b24]"
              }`}
              title={p}
            >
              Fase {i + 1}
            </button>
          ))}
        </div>
      </div>
      {/* ── Task List ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6 max-h-[720px] space-y-4">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-16 text-[oklch(0.50_0.03_265)] text-sm">
            Tidak ada task untuk filter ini.
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isDone = task.status === "done";
            const isInProgress = task.status === "in_progress";
            const isExpanded = expandedTaskId === task.id;

            return (
              <div
                key={task.id}
                className={`rounded-xl border transition-all p-5 ${
                  isDone
                    ? "bg-[#0f151e]/60 border-[oklch(0.20_0.025_265)] opacity-85"
                    : isInProgress
                    ? "bg-[#141c28] border-[oklch(0.65_0.18_170/0.4)] shadow-lg shadow-teal-950/20"
                    : "bg-[#121823] border-[oklch(0.22_0.03_265)] hover:border-[oklch(0.32_0.04_265)]"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left: Status Checkbox & Title */}
                  <div className="flex items-start gap-3.5 flex-1">
                    <button
                      onClick={() => toggleTaskStatus(task.id)}
                      className="mt-0.5 shrink-0 text-[oklch(0.60_0.03_265)] hover:text-white transition-colors cursor-pointer"
                      title="Klik untuk ubah status (To Do -> In Progress -> Done)"
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : isInProgress ? (
                        <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                      ) : (
                        <Circle className="w-5 h-5 text-[oklch(0.40_0.03_265)]" />
                      )}
                    </button>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#182230] text-[oklch(0.70_0.12_60)] border border-[oklch(0.25_0.03_265)]">
                          {task.phaseTitle.split(":")[0]}
                        </span>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                            isDone
                              ? "bg-emerald-950/50 text-emerald-400 border border-emerald-800/40"
                              : isInProgress
                              ? "bg-amber-950/50 text-amber-300 border border-amber-800/40"
                              : "bg-[#1a2332] text-[oklch(0.65_0.03_265)]"
                          }`}
                        >
                          {isDone ? "SELESAI" : isInProgress ? "SEDANG DIKERJAKAN" : "TO DO"}
                        </span>
                      </div>

                      <h3
                        className={`text-base font-bold ${
                          isDone
                            ? "text-[oklch(0.70_0.02_265)] line-through"
                            : "text-[oklch(0.95_0.01_265)]"
                        }`}
                      >
                        {task.title}
                      </h3>

                      <p className="text-xs text-[oklch(0.60_0.03_265)] leading-relaxed">
                        {task.description}
                      </p>

                      {/* Files list */}
                      {task.files.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-[oklch(0.45_0.03_265)]">Target:</span>
                          {task.files.map((file) => (
                            <span
                              key={file}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#18212e] text-[oklch(0.75_0.08_290)] border border-[oklch(0.24_0.03_265)]"
                            >
                              {file}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Action: Copy AI Coding Prompt */}
                  <div className="flex items-center sm:flex-col sm:items-end gap-2 shrink-0">
                    <button
                      onClick={() => copyTaskPrompt(task)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 shadow-md shadow-rose-950/30 transition-all cursor-pointer"
                      title="Salin prompt siap paste ke Cursor / Claude Code / Windsurf / Copilot"
                    >
                      {copiedTaskId === task.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-white" />
                          <span>Prompt Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                          <span>Salin Prompt AI</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() =>
                        setExpandedTaskId(isExpanded ? null : task.id)
                      }
                      className="flex items-center gap-1 text-[11px] text-[oklch(0.55_0.03_265)] hover:text-white transition-colors cursor-pointer"
                    >
                      <span>{isExpanded ? "Tutup Prompt" : "Lihat Prompt"}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded AI prompt preview */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-[oklch(0.18_0.025_265)]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-semibold text-[oklch(0.70_0.14_60)] uppercase tracking-wider">
                        Prompt AI Coding Agent (Cursor / Claude Code / Cline)
                      </span>
                      <button
                        onClick={() => copyTaskPrompt(task)}
                        className="text-xs text-[oklch(0.70_0.03_265)] hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </button>
                    </div>
                    <pre className="p-3 rounded-lg bg-[#0b0f15] border border-[oklch(0.20_0.025_265)] text-xs text-[oklch(0.85_0.04_170)] font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto custom-scrollbar">
                      {task.agentPrompt}
                    </pre>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


