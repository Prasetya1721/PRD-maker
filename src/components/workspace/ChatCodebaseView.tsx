"use client";

import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Send, Bot, User, Copy, Check, Sparkles, FolderGit2 } from "lucide-react";
import { toAiConfigPayload, useAiSettings } from "@/lib/useAiSettings";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ChatCodebaseViewProps {
  projectName: string;
  projectSlug: string;
  idea: string;
  prdMarkdown: string;
}

export default function ChatCodebaseView({
  projectName,
  projectSlug,
  idea,
  prdMarkdown,
}: ChatCodebaseViewProps) {
  const { settings } = useAiSettings();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Halo! Saya adalah **AI Codebase Architect** untuk proyek **${projectName}** (\`${projectSlug}\`).\n\nSaya telah mempelajari ide, spesifikasi PRD, arsitektur, dan roadmap task Anda. Anda bisa menanyakan apapun seputar:\n- Cara implementasi fitur tertentu di Cursor/Claude Code/Windsurf\n- Desain database schema & migration script SQL\n- Struktur folder & dependensi Next.js 15\n- Solusi bug teknis atau best practice arsitektur\n\nAda yang ingin Anda diskusikan?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (userText: string) => {
    const text = userText.trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages,
          context: {
            projectName,
            idea,
            prdMarkdown,
          },
          ...toAiConfigPayload(settings),
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `⚠️ Error: ${data.error || "Gagal menghubungi AI model. Cek pengaturan API key."}`,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.content },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "⚠️ Gagal terhubung ke server chat. Pastikan server dev aktif.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyMessage = async (content: string, index: number) => {
    await navigator.clipboard.writeText(content);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const QUICK_PROMPTS = [
    "Bagaimana skema migrasi database PostgreSQL yang paling optimal?",
    "Buatkan prompt presisi Cursor untuk halaman dashboard utama",
    "Tuliskan struktur direktori src/ yang paling rapi untuk proyek ini",
    "Bagaimana alur autentikasi dan middleware yang aman?",
  ];

  return (
    <div className="flex flex-col h-[720px] rounded-2xl overflow-hidden border border-[oklch(0.22_0.03_265)] bg-[#0d1219] shadow-2xl">
      {/* Top Header */}
      <header className="flex items-center justify-between px-5 py-3.5 border-b border-[oklch(0.20_0.025_265)] bg-[#0f141d]/90 backdrop-blur-md">
        <div className="flex items-center gap-2 text-sm text-[oklch(0.65_0.03_265)]">
          <span className="font-semibold text-[oklch(0.88_0.02_265)]">
            ngodingpake<span className="text-[oklch(0.70_0.20_35)]">ai</span>
          </span>
          <span className="text-[oklch(0.35_0.02_265)]">·</span>
          <div className="flex items-center gap-1.5 font-mono text-xs text-[oklch(0.80_0.02_265)]">
            <FolderGit2 className="w-3.5 h-3.5 text-[oklch(0.65_0.18_170)]" />
            <span className="text-[oklch(0.65_0.03_265)]">{projectSlug}</span>
            <span className="text-[oklch(0.40_0.02_265)]">/</span>
            <span className="text-[oklch(0.92_0.01_265)] font-semibold">Chat Codebase</span>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-[#18212e] text-[oklch(0.75_0.14_170)] border border-[oklch(0.24_0.03_265)]">
          {settings.provider} · {settings.model}
        </span>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-3 max-w-3xl ${
              m.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            }`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                m.role === "user"
                  ? "bg-[oklch(0.65_0.20_35)] text-white"
                  : "bg-[#182332] text-[oklch(0.75_0.14_60)] border border-[oklch(0.28_0.03_265)]"
              }`}
            >
              {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div
              className={`relative group rounded-2xl p-4 text-xs leading-relaxed ${
                m.role === "user"
                  ? "bg-[#1d2636] text-[oklch(0.95_0.01_265)] border border-[oklch(0.28_0.04_265)]"
                  : "bg-[#121822] text-[oklch(0.85_0.02_265)] border border-[oklch(0.20_0.025_265)]"
              }`}
            >
              <div className="prose-prd text-xs">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {m.content}
                </ReactMarkdown>
              </div>

              {m.role === "assistant" && (
                <button
                  onClick={() => copyMessage(m.content, idx)}
                  className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 p-1 rounded bg-[#1c2635] text-[oklch(0.60_0.03_265)] hover:text-white transition-all cursor-pointer"
                  title="Salin jawaban"
                >
                  {copiedIndex === idx ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 max-w-xl mr-auto">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[#182332] text-[oklch(0.75_0.14_60)] border border-[oklch(0.28_0.03_265)]">
              <Bot className="w-4 h-4" />
            </div>
            <div className="rounded-2xl p-3.5 bg-[#121822] border border-[oklch(0.20_0.025_265)] flex items-center gap-1.5">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-5 py-2 border-t border-[oklch(0.18_0.025_265)] bg-[#10151f] flex items-center gap-2 overflow-x-auto custom-scrollbar">
        <span className="text-[10px] text-[oklch(0.45_0.03_265)] shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-[oklch(0.70_0.16_60)]" /> Tanya Cepat:
        </span>
        {QUICK_PROMPTS.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSend(qp)}
            className="text-[11px] px-2.5 py-1 rounded-full bg-[#141b26] hover:bg-[#1a2332] text-[oklch(0.70_0.03_265)] hover:text-white border border-[oklch(0.20_0.025_265)] shrink-0 transition-all cursor-pointer truncate max-w-xs"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="p-3 border-t border-[oklch(0.18_0.025_265)] bg-[#0d1219] flex gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Tanyakan arsitektur kode, SQL schema, atau prompt Cursor..."
          className="flex-1 px-4 py-2.5 rounded-xl bg-[#121822] border border-[oklch(0.20_0.025_265)] text-xs text-white placeholder-[oklch(0.45_0.03_265)] focus:outline-none focus:border-[oklch(0.50_0.15_290)] transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="px-4 py-2.5 rounded-xl bg-[oklch(0.65_0.20_35)] hover:bg-[oklch(0.60_0.20_35)] disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Kirim</span>
        </button>
      </form>
    </div>
  );
}

