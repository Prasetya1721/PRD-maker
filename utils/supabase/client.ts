"use client";

import { createBrowserClient } from "@supabase/ssr";

function readEnv(name: string): string {
  return (process.env[name] ?? "").trim();
}

/** true bila URL + anon key sudah diisi nilai asli (bukan placeholder contoh). */
export function isSupabaseConfigured(): boolean {
  const url = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!url || !key) return false;
  if (url.includes("your_") || key.includes("your_")) return false;
  if (!/^https?:\/\//i.test(url)) return false;
  if (key.length < 20) return false;
  return true;
}

/**
 * Factory browser client. Dibuat per-panggilan (bukan singleton module-level)
 * supaya build/prerender tidak crash saat env belum diisi.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Singleton lazily — aman diimpor module-level karena tidak menyentuh
 * env sebelum dipakai pertama kali.
 * @deprecated Pakai `createClient()` langsung.
 */
let cached: ReturnType<typeof createClient> | null = null;
export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_t, prop) {
    cached ??= createClient();
    const value = (cached as unknown as Record<PropertyKey, unknown>)[prop];
    return typeof value === "function"
      ? (value as (...a: unknown[]) => unknown).bind(cached)
      : value;
  },
});

