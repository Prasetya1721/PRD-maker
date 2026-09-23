"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient, isSupabaseConfigured } from "../../utils/supabase/client";

type Mode = "signin" | "signup";

const inputStyle: React.CSSProperties = {
  background: "oklch(0.10 0.025 265)",
  border: "1px solid oklch(0.24 0.03 265)",
  color: "oklch(0.90 0.01 265)",
};

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";
  const urlError = params.get("error");

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(urlError);
  const [info, setInfo] = useState<string | null>(null);
  const configured = isSupabaseConfigured();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email.trim() || !password) {
      setError("Email dan password wajib diisi.");
      return;
    }
    if (password.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClient();
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
          },
        });
        if (error) throw error;
        setInfo("Akun dibuat. Cek email untuk verifikasi, lalu login.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        router.push(next);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      if (error) throw error;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login Google gagal.");
      setLoading(false);
    }
  }
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div
        className="w-full max-w-md rounded-2xl p-8"
        style={{
          background: "oklch(0.11 0.025 265)",
          border: "1px solid oklch(0.24 0.03 265)",
          boxShadow: "0 0 40px oklch(0.65 0.22 290 / 0.15)",
        }}
      >
        <Link href="/" className="text-xs font-semibold gradient-text">
          {"\u2190 Kembali ke PRD-Genius"}
        </Link>
        <h1 className="text-2xl font-extrabold mt-3 text-[oklch(0.95_0.01_265)]">
          {mode === "signin" ? "Login" : "Daftar Akun"}
        </h1>
        <p className="text-sm mt-1 text-[oklch(0.58_0.04_265)]">
          {mode === "signin"
            ? "Masuk untuk menyimpan workspace PRD Anda."
            : "Buat akun baru dengan email & password."}
        </p>

        {!configured && (
          <div
            className="mt-4 rounded-xl p-3.5 text-xs leading-relaxed"
            style={{
              background: "oklch(0.70 0.16 75 / 0.10)",
              border: "1px solid oklch(0.70 0.16 75 / 0.35)",
              color: "oklch(0.80 0.14 75)",
            }}
          >
            <p className="font-bold mb-1">Supabase belum dikonfigurasi</p>
            <p className="font-mono text-[11px] break-all opacity-90">
              Isi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY di
              .env.local dengan nilai asli dari dashboard Supabase, lalu restart
              npm run dev.
            </p>
          </div>
        )}

        {(error || info) && (
          <div
            className="mt-4 rounded-xl p-3.5 text-xs leading-relaxed"
            style={
              error
                ? {
                    background: "oklch(0.68 0.20 25 / 0.10)",
                    border: "1px solid oklch(0.68 0.20 25 / 0.35)",
                    color: "oklch(0.75 0.16 25)",
                  }
                : {
                    background: "oklch(0.45 0.18 170 / 0.10)",
                    border: "1px solid oklch(0.45 0.18 170 / 0.35)",
                    color: "oklch(0.70 0.15 170)",
                  }
            }
          >
            {error ?? info}
          </div>
        )}

        <div
          className="grid grid-cols-2 gap-1 mt-6 p-1 rounded-xl"
          style={{ background: "oklch(0.10 0.025 265)" }}
        >
          {(["signin", "signup"] as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
                setInfo(null);
              }}
              className="py-2 rounded-lg text-sm font-semibold transition-all"
              style={
                mode === m
                  ? {
                      background:
                        "linear-gradient(135deg, oklch(0.65 0.22 290), oklch(0.55 0.22 230))",
                      color: "white",
                    }
                  : { color: "oklch(0.58 0.04 265)" }
              }
            >
              {m === "signin" ? "Masuk" : "Daftar"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[oklch(0.58_0.04_265)]">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
              style={inputStyle}
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-[oklch(0.58_0.04_265)]">
              Password
            </label>
            <input
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              className="mt-1.5 w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
              style={inputStyle}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !configured}
            className="w-full py-3 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.65 0.22 290), oklch(0.55 0.22 230))",
              color: "white",
              boxShadow: "0 0 20px oklch(0.65 0.22 290 / 0.30)",
            }}
          >
            {loading
              ? "Memproses..."
              : mode === "signin"
                ? "Masuk"
                : "Buat Akun"}
          </button>
        </form>

        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-[oklch(0.22_0.03_265)]" />
          <span className="text-[11px] text-[oklch(0.45_0.04_265)]">atau</span>
          <div className="flex-1 h-px bg-[oklch(0.22_0.03_265)]" />
        </div>

        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading || !configured}
          className="w-full py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
          style={{
            background: "oklch(0.16 0.03 265)",
            border: "1px solid oklch(0.26 0.04 290)",
            color: "oklch(0.85 0.02 265)",
          }}
        >
          Lanjutkan dengan Google
        </button>

        <p className="mt-4 text-[11px] leading-relaxed text-[oklch(0.45_0.04_265)]">
          Dengan masuk Anda menyetujui ketentuan layanan. Sesi disimpan aman
          via cookie HttpOnly Supabase dan di-refresh otomatis oleh proxy.
        </p>
      </div>
    </div>
  );
}

