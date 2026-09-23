"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  describeModel,
  getProvider,
} from "@/lib/ai-providers";
import { toAiConfigPayload, useAiSettings } from "@/lib/useAiSettings";
import {
  buildDefaultRoadmap,
  buildDefaultWiki,
} from "@/lib/workspace-generator";


/* ─── Types ─────────────────────────────────────────────── */
type Phase = "idle" | "clarifying" | "answering" | "generating" | "done" | "error";

/* ─── Helpers ────────────────────────────────────────────── */
function cn(...classes: (string | undefined | false | null)[]) {
  return classes.filter(Boolean).join(" ");
}

/* ─── Feature badges ─────────────────────────────────────── */
const FEATURES = [
  { icon: "📚", label: "Wiki Baseline Codebase" },
  { icon: "📖", label: "Roadmap Task AI Coding" },
  { icon: "💬", label: "Chat Codebase" },
  { icon: "📋", label: "PRD & Master Prompt" },
];



export default function Home() {
  const router = useRouter();
  const { settings } = useAiSettings();

  const [idea, setIdea] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [progressLabel, setProgressLabel] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [errorIsConfig, setErrorIsConfig] = useState(false);
  const answerRef = useRef<HTMLTextAreaElement>(null);

  /* Provider/model yang sedang aktif (dibaca dari localStorage) */
  const activeProvider = getProvider(settings.provider);
  const activeModelLabel = describeModel(
    settings.provider,
    settings.model,
    settings.baseUrl
  );
  const hasApiKey = Boolean(settings.apiKey.trim());

  /* Focus textarea when question changes */
  useEffect(() => {
    if (phase === "answering") {
      // Transisi pertanyaan baru memang perlu mereset input & memindah fokus,
      // ini sinkronisasi DOM nyata (bukan turunan state) sehingga dikecualikan.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentAnswer("");
      answerRef.current?.focus();
    }
  }, [currentQ, phase]);

  /* ─── Step 1: Clarify ─────────────────────────────────── */
  const handleClarify = async () => {
    if (!idea.trim()) return;
    setPhase("clarifying");
    setErrorMsg("");
    setErrorIsConfig(false);
    try {
      const res = await fetch("/api/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea,
          ...toAiConfigPayload(settings),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setErrorMsg(data.error || `Server error (${res.status})`);
        setErrorIsConfig(Boolean(data.isConfigError));
        setPhase("error");
        return;
      }
      setQuestions(data.questions || []);
      setCurrentQ(0);
      setAnswers({});
      setPhase("answering");
    } catch (err) {
      console.error(err);
      setErrorMsg("Tidak dapat terhubung ke server. Pastikan dev server berjalan.");
      setPhase("error");
    }
  };

  /* ─── Step 2: Collect answer ──────────────────────────── */
  const submitAnswer = (answer: string) => {
    const q = questions[currentQ];
    const newAnswers = { ...answers, [q]: answer || "Skipped" };
    setAnswers(newAnswers);

    if (currentQ < questions.length - 1) {
      setCurrentQ((p) => p + 1);
    } else {
      handleGenerate(newAnswers);
    }
  };

  /* ─── Step 3: Generate PRD ────────────────────────────── */
  const handleGenerate = async (finalAnswers: Record<string, string>) => {
    setPhase("generating");
    setErrorMsg("");
    setErrorIsConfig(false);

    const labels = [
      "Menganalisis ide Anda...",
      "Menyusun Executive Summary...",
      "Merancang User Stories...",
      "Membangun Tech Stack...",
      "Menyempurnakan Master Prompt...",
    ];

    let idx = 0;
    setProgressLabel(labels[0]);
    const interval = setInterval(() => {
      idx = (idx + 1) % labels.length;
      setProgressLabel(labels[idx]);
    }, 2200);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea,
          answers: finalAnswers,
          ...toAiConfigPayload(settings),
        }),
      });
      const data = await res.json();
      clearInterval(interval);

      if (!res.ok || data.error) {
        setErrorMsg(data.error || `Server error (${res.status})`);
        setErrorIsConfig(Boolean(data.isConfigError));
        setPhase("error");
        return;
      }

      /* Store result in sessionStorage so result page can read it */
      sessionStorage.setItem("prd_result", JSON.stringify({
        projectName: data.projectName,
        projectSlug: data.projectSlug,
        prdMarkdown: data.prdMarkdown,
        masterPrompt: data.masterPrompt,
        wiki: data.wiki,
        roadmap: data.roadmap,
        idea,
        generatedAt: new Date().toISOString(),
        provider: data.meta?.provider ?? activeProvider.label,
        model: data.meta?.model ?? settings.model,
      }));

      setPhase("done");
      router.push("/result");
    } catch (err) {
      console.error(err);
      clearInterval(interval);
      setErrorMsg("Tidak dapat terhubung ke server. Pastikan dev server berjalan.");
      setPhase("error");
    }
  };

  const handleLoadSampleWorkspace = () => {
    const sampleIdea =
      "Platform terpadu untuk perencanaan dan manajemen pengembangan produk berbasis AI. Memfasilitasi alur kerja mulai dari onboarding pengguna, penyusunan spesifikasi (PRD) dan roadmap melalui wizard terpandu, visualisasi workspace (task board, wiki, chat codebase), hingga layanan monetisasi seperti paket langganan, add-on credit, voucher, alur pembayaran manual, dan pemesanan sesi coaching.";
    const sampleName = "ngodingpakeai";
    const sampleSlug = "rafiulm/ngodingpakeai";
    const defaultWiki = buildDefaultWiki(sampleName, sampleSlug, sampleIdea);
    const defaultRoadmap = buildDefaultRoadmap(sampleName, sampleIdea);

    sessionStorage.setItem(
      "prd_result",
      JSON.stringify({
        projectName: sampleName,
        projectSlug: sampleSlug,
        idea: sampleIdea,
        generatedAt: new Date().toISOString(),
        provider: "AI Architect",
        model: "gpt-4o",
        prdMarkdown: `# PRD: ngodingpakeai — Platform AI Coding & Workspace Terpadu

## 1. Executive Summary
Repository **rafiulm/ngodingpakeai** merupakan platform terpadu untuk perencanaan dan manajemen pengembangan produk berbasis AI. Sistem ini memfasilitasi alur kerja mulai dari onboarding pengguna, penyusunan spesifikasi (PRD) dan roadmap melalui wizard terpandu, visualisasi workspace (task board, wiki, chat codebase), hingga layanan monetisasi.

## 2. Core Features
- **Wizard PRD & Spec Generator:** Mengubah ide mentah menjadi rencana produk dan spesifikasi modular.
- **Baseline Codebase & Documentation (Wiki):** Menyusun arsitektur sistem, peta aplikasi, antarmuka, dan skema database.
- **Roadmap & Task AI Coding:** Daftar tugas terstruktur dengan prompt presisi yang siap disalin ke Cursor, Claude Code, Windsurf, dan Copilot.
- **Chat Codebase:** Asisten AI cerdas untuk tanya jawab arsitektur dan debugging kode.`,
        masterPrompt: `Sebagai Lead AI Architect, bangun repository ngodingpakeai dengan Next.js 15 App Router, TypeScript, Tailwind CSS, dan Supabase Database. Ikuti Roadmap Task yang telah disusun secara terstruktur.`,
        wiki: defaultWiki,
        roadmap: defaultRoadmap,
      })
    );

    router.push("/result");
  };

  /* ─── Render: ERROR ──────────────────────────────────── */
  if (phase === "error") {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="glass-card rounded-3xl p-10 text-center max-w-lg w-full animate-scale-in">
          {/* Error icon */}
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: "oklch(0.65 0.22 25 / 0.15)", border: "1px solid oklch(0.65 0.22 25 / 0.3)" }}>
            <span className="text-3xl">{errorIsConfig ? "🔑" : "⚠️"}</span>
          </div>

          <h2 className="text-xl font-bold mb-3" style={{ color: "oklch(0.85 0.12 25)" }}>
            {errorIsConfig ? "Koneksi Model Bermasalah" : "Terjadi Kesalahan"}
          </h2>

          <p className="text-sm leading-relaxed mb-6 break-words text-left" style={{ color: "oklch(0.60 0.04 265)" }}>
            {errorMsg}
          </p>

          {errorIsConfig && (
            <div className="text-left rounded-xl p-4 mb-6 text-xs font-mono"
              style={{ background: "oklch(0.10 0.02 265)", border: "1px solid oklch(0.22 0.03 265)", color: "oklch(0.70 0.10 290)" }}>
              <p className="text-[oklch(0.50_0.04_265)] mb-2">
                {activeProvider.icon} {activeProvider.label} · {settings.model}
              </p>
              <p className="break-all">
                {activeProvider.env.apiKeyVar}=
                <span style={{ color: "oklch(0.65 0.18 170)" }}>
                  {activeProvider.apiKeyPlaceholder}
                </span>
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              className="flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200"
              style={{ background: "oklch(0.16 0.03 265)", color: "oklch(0.60 0.04 265)", border: "1px solid oklch(0.22 0.03 265)" }}
              onClick={() => { setPhase("idle"); setErrorMsg(""); }}
            >
              ← Kembali
            </button>
            <button
              className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, oklch(0.65 0.22 290), oklch(0.55 0.22 230))",
                color: "white",
                boxShadow: "0 0 20px oklch(0.65 0.22 290 / 0.30)",
              }}
              onClick={() => {
                setErrorMsg("");
                if (questions.length > 0) {
                  handleGenerate(answers);
                } else {
                  handleClarify();
                }
              }}
            >
              Coba Lagi ↻
            </button>
          </div>
        </div>
      </div>
    );
  }


  /* ─── Render: GENERATING ──────────────────────────────── */
  if (phase === "generating" || phase === "done") {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="glass-card rounded-3xl p-10 text-center max-w-sm w-full animate-scale-in glow-soft">
          {/* Animated spinner */}
          <div className="relative mx-auto mb-8 w-24 h-24">
            <div
              className="absolute inset-0 rounded-full animate-spin"
              style={{
                background: "conic-gradient(from 0deg, transparent 75%, oklch(0.65 0.22 290))",
                padding: "3px",
              }}
            />
            <div className="absolute inset-[3px] rounded-full"
              style={{ background: "oklch(0.11 0.025 265)" }} />
            <div className="absolute inset-0 flex items-center justify-center text-3xl">
              ✨
            </div>
          </div>

          <h2 className="text-xl font-bold gradient-text mb-3">
            Generating PRD...
          </h2>
          <p className="text-sm text-[oklch(0.55_0.04_265)] min-h-[1.5rem] transition-all">
            {progressLabel}
          </p>

          {/* Typing dots */}
          <div className="flex justify-center gap-2 mt-6">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        </div>
      </div>
    );
  }

  /* ─── Render: ANSWERING ───────────────────────────────── */
  if (phase === "answering") {
    const progressDone = ((currentQ + 1) / questions.length) * 100;

    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg animate-fade-in-up">
          {/* Header */}
          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold mb-3"
              style={{
                background: "oklch(0.65 0.22 290 / 0.15)",
                color: "oklch(0.78 0.18 290)",
                border: "1px solid oklch(0.65 0.22 290 / 0.25)",
              }}>
              Klarifikasi {currentQ + 1} / {questions.length}
            </span>
            <h2 className="text-2xl font-bold text-[oklch(0.92_0.01_265)]">
              Satu pertanyaan lagi...
            </h2>
          </div>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="w-full rounded-full h-1.5 overflow-hidden"
              style={{ background: "oklch(0.18 0.03 265)" }}>
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${progressDone}%`,
                  background: "linear-gradient(90deg, oklch(0.65 0.22 290), oklch(0.60 0.22 230))",
                  boxShadow: "0 0 12px oklch(0.65 0.22 290 / 0.6)",
                }}
              />
            </div>
            {/* Step dots */}
            <div className="flex justify-between mt-2">
              {questions.map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full transition-all duration-300"
                  style={{
                    background: i < currentQ + 1
                      ? "oklch(0.65 0.22 290)"
                      : "oklch(0.22 0.03 265)",
                    boxShadow: i === currentQ ? "0 0 8px oklch(0.65 0.22 290 / 0.8)" : "none",
                    transform: i === currentQ ? "scale(1.4)" : "scale(1)",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Question card */}
          <div className="glass-card rounded-2xl p-8 glow-soft">
            <p className="text-base font-medium text-[oklch(0.90_0.01_265)] mb-6 leading-relaxed">
              {questions[currentQ]}
            </p>

            <textarea
              ref={answerRef}
              className="w-full rounded-xl p-4 text-sm resize-none focus:outline-none transition-all duration-200"
              style={{
                minHeight: "120px",
                background: "oklch(0.10 0.025 265)",
                border: "1px solid oklch(0.25 0.04 265)",
                color: "oklch(0.90 0.01 265)",
              }}
              placeholder="Ketik jawaban Anda... (tekan Enter untuk lanjut, Shift+Enter untuk baris baru)"
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.border = "1px solid oklch(0.65 0.22 290 / 0.7)";
                e.currentTarget.style.boxShadow = "0 0 20px oklch(0.65 0.22 290 / 0.15)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.border = "1px solid oklch(0.25 0.04 265)";
                e.currentTarget.style.boxShadow = "none";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  submitAnswer(currentAnswer);
                }
              }}
            />

            <div className="flex gap-3 mt-4">
              <button
                className="flex-1 py-3 rounded-xl text-sm font-medium transition-all duration-200"
                style={{
                  background: "oklch(0.16 0.03 265)",
                  color: "oklch(0.60 0.04 265)",
                  border: "1px solid oklch(0.22 0.03 265)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.19 0.03 265)";
                  (e.currentTarget as HTMLButtonElement).style.color = "oklch(0.75 0.04 265)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = "oklch(0.16 0.03 265)";
                  (e.currentTarget as HTMLButtonElement).style.color = "oklch(0.60 0.04 265)";
                }}
                onClick={() => submitAnswer("Skipped")}
              >
                Lewati
              </button>
              <button
                className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: "linear-gradient(135deg, oklch(0.65 0.22 290), oklch(0.55 0.22 230))",
                  color: "white",
                  boxShadow: "0 0 20px oklch(0.65 0.22 290 / 0.35)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 0 30px oklch(0.65 0.22 290 / 0.55)";
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.boxShadow =
                    "0 0 20px oklch(0.65 0.22 290 / 0.35)";
                  (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
                }}
                onClick={() => submitAnswer(currentAnswer)}
              >
                {currentQ < questions.length - 1 ? "Selanjutnya →" : "Generate PRD ✨"}
              </button>
            </div>
          </div>

          {/* Idea recap */}
          <p className="text-center text-xs text-[oklch(0.40_0.04_265)] mt-5 px-4 truncate">
            📌 {idea.slice(0, 80)}{idea.length > 80 ? "..." : ""}
          </p>
        </div>
      </div>
    );
  }

  /* ─── Render: LOADING (clarifying) ───────────────────── */
  if (phase === "clarifying") {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4">
        <div className="text-center animate-fade-in">
          <div className="flex justify-center gap-2 mb-4">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
          <p className="text-[oklch(0.55_0.04_265)] text-sm">
            Menganalisis ide Anda...
          </p>
        </div>
      </div>
    );
  }

  /* ─── Render: IDLE (landing) ──────────────────────────── */
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-12 animate-fade-in-up max-w-3xl">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
          style={{
            background: "oklch(0.65 0.22 290 / 0.12)",
            color: "oklch(0.78 0.18 290)",
            border: "1px solid oklch(0.65 0.22 290 / 0.25)",
          }}>
          <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.65_0.22_290)] animate-pulse" />
          AI-Powered · GPT-4o · Instant PRD
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tight mb-6">
          <span className="gradient-text">Ubah Ide</span>
          <br />
          <span className="text-[oklch(0.92_0.01_265)]">Jadi PRD</span>{" "}
          <span className="gradient-text">Instan</span>
        </h1>

        <p className="text-lg text-[oklch(0.55_0.04_265)] max-w-xl mx-auto leading-relaxed">
          Ceritakan ide aplikasimu, jawab 5 pertanyaan singkat, dan dapatkan{" "}
          <strong className="text-[oklch(0.75_0.08_265)]">PRD lengkap</strong>{" "}
          beserta{" "}
          <strong className="text-[oklch(0.75_0.08_265)]">Master Dev Prompt</strong>{" "}
          dalam hitungan detik.
        </p>

        {/* Feature badges */}
        <div className="flex flex-wrap justify-center gap-2 mt-6">
          {FEATURES.map((f) => (
            <span key={f.label}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: "oklch(0.14 0.025 265)",
                color: "oklch(0.65 0.04 265)",
                border: "1px solid oklch(0.20 0.03 265)",
              }}>
              {f.icon} {f.label}
            </span>
          ))}
        </div>

        {/* Status provider aktif */}
        <div className="flex justify-center mt-4">
          <span
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-mono"
            style={{
              background: "oklch(0.12 0.03 265)",
              border: `1px solid ${
                hasApiKey ? "oklch(0.45 0.18 170 / 0.45)" : "oklch(0.70 0.16 75 / 0.40)"
              }`,
              color: hasApiKey ? "oklch(0.70 0.14 170)" : "oklch(0.75 0.12 75)",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: hasApiKey ? "oklch(0.65 0.18 170)" : "oklch(0.70 0.16 75)",
              }}
            />
            {activeProvider.icon} {activeProvider.label} · {activeModelLabel}
            {!hasApiKey && " · pakai key server"}
          </span>
        </div>
      </div>

      {/* Main input card */}
      <div
        className="w-full max-w-2xl animate-fade-in-up glass-card rounded-3xl p-8 glow-soft"
        style={{ animationDelay: "0.1s" }}
      >
        <label className="block text-sm font-semibold text-[oklch(0.70_0.06_265)] mb-3">
          🚀 Ceritakan ide aplikasimu
        </label>

        <textarea
          className="w-full rounded-xl p-4 text-sm resize-none focus:outline-none transition-all duration-200"
          style={{
            minHeight: "180px",
            background: "oklch(0.10 0.025 265)",
            border: "1px solid oklch(0.22 0.03 265)",
            color: "oklch(0.90 0.01 265)",
            lineHeight: "1.7",
          }}
          placeholder={"Contoh: Saya ingin membuat aplikasi marketplace untuk jual-beli produk digital seperti template, ebook, dan plugin. Target pengguna adalah freelancer dan kreator konten Indonesia. Fitur utama yang ingin saya bangun adalah..."}
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          onFocus={(e) => {
            e.currentTarget.style.border = "1px solid oklch(0.65 0.22 290 / 0.7)";
            e.currentTarget.style.boxShadow = "0 0 24px oklch(0.65 0.22 290 / 0.12)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.border = "1px solid oklch(0.22 0.03 265)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />

        {/* Character count */}
        <div className="flex justify-between items-center mt-2 mb-5">
          <span className="text-xs text-[oklch(0.38_0.04_265)]">
            Semakin detail, semakin akurat hasilnya
          </span>
          <span className={cn(
            "text-xs font-mono",
            idea.length > 100 ? "text-[oklch(0.65_0.22_290)]" : "text-[oklch(0.40_0.04_265)]"
          )}>
            {idea.length} chars
          </span>
        </div>

        <button
          className="w-full py-4 rounded-xl text-base font-bold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
          style={{
            background: idea.trim()
              ? "linear-gradient(135deg, oklch(0.65 0.22 290), oklch(0.55 0.22 230))"
              : "oklch(0.18 0.03 265)",
            color: idea.trim() ? "white" : "oklch(0.45 0.04 265)",
            boxShadow: idea.trim() ? "0 0 30px oklch(0.65 0.22 290 / 0.35)" : "none",
            transform: "translateY(0)",
          }}
          disabled={!idea.trim()}
          onClick={handleClarify}
          onMouseEnter={(e) => {
            if (idea.trim()) {
              (e.currentTarget as HTMLButtonElement).style.boxShadow =
                "0 0 50px oklch(0.65 0.22 290 / 0.55)";
              (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.boxShadow = idea.trim()
              ? "0 0 30px oklch(0.65 0.22 290 / 0.35)"
              : "none";
            (e.currentTarget as HTMLButtonElement).style.transform = "translateY(0)";
          }}
        >
          ✨ Mulai Generate PRD
        </button>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-[oklch(0.20_0.025_265)]"></div>
          <span className="shrink mx-4 text-xs text-[oklch(0.45_0.03_265)]">atau</span>
          <div className="flex-grow border-t border-[oklch(0.20_0.025_265)]"></div>
        </div>

        <button
          type="button"
          onClick={handleLoadSampleWorkspace}
          className="w-full py-3.5 rounded-xl text-xs font-semibold transition-all duration-200 bg-[#16202c] hover:bg-[#1e2b3c] text-[oklch(0.85_0.10_45)] hover:text-white border border-[oklch(0.30_0.04_265)] hover:border-[oklch(0.45_0.05_265)] flex items-center justify-center gap-2 cursor-pointer shadow-md"
        >
          <span>🔥 Buka Contoh Baseline Workspace & Wiki (seperti ngodingpakeai)</span>
        </button>
      </div>

      {/* Social proof / info */}
      <p className="mt-8 text-xs text-[oklch(0.35_0.04_265)] animate-fade-in" style={{ animationDelay: "0.3s" }}>
        Gratis selamanya untuk penggunaan personal · Tidak perlu login
      </p>
    </div>
  );
}
