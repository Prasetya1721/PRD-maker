"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  DEFAULT_MODEL,
  DEFAULT_PROVIDER,
  PROVIDERS,
  getProvider,
  type AiConfigPayload,
  type AiSettings,
  type ProviderId,
} from "@/lib/ai-providers";

const STORAGE_KEY = "prd_genius_ai_settings";
/** Event kustom agar semua komponen ikut ter-update saat settings berubah. */
const SYNC_EVENT = "prd-genius:ai-settings-changed";

export const DEFAULT_AI_SETTINGS: AiSettings = {
  provider: DEFAULT_PROVIDER,
  model: DEFAULT_MODEL,
  apiKey: "",
  baseUrl: "",
};

/* ─── Storage helpers (aman untuk SSR) ─────────────────────── */

/*
 * `useSyncExternalStore` membandingkan snapshot dengan `Object.is`.
 * Karena `readSettings()` menghasilkan objek baru tiap panggilan, kita
 * cache hasilnya per-raw-string agar referensi stabil selama isi
 * localStorage tidak berubah — mencegah infinite render loop.
 */
let cachedRaw: string | null = null;
let cachedSnapshot: AiSettings | null = null;
let cachedFallback: AiSettings | null = null;

function readSettings(): AiSettings {
  if (typeof window === "undefined") {
    cachedFallback ??= { ...DEFAULT_AI_SETTINGS };
    return cachedFallback;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      if (cachedRaw !== null || !cachedSnapshot) {
        cachedRaw = null;
        cachedSnapshot = { ...DEFAULT_AI_SETTINGS };
      }
      return cachedSnapshot;
    }
    if (raw === cachedRaw && cachedSnapshot) return cachedSnapshot;

    const parsed = JSON.parse(raw) as Partial<AiSettings>;

    const provider: ProviderId =
      parsed.provider && parsed.provider in PROVIDERS
        ? parsed.provider
        : DEFAULT_PROVIDER;

    cachedRaw = raw;
    cachedSnapshot = {
      provider,
      model:
        typeof parsed.model === "string" && parsed.model.trim()
          ? parsed.model
          : getProvider(provider).models[0].id,
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : "",
      baseUrl: typeof parsed.baseUrl === "string" ? parsed.baseUrl : "",
      lastTest: parsed.lastTest,
    };
    return cachedSnapshot;
  } catch {
    cachedRaw = null;
    cachedSnapshot ??= { ...DEFAULT_AI_SETTINGS };
    return cachedSnapshot;
  }
}

function writeSettings(settings: AiSettings) {
  if (typeof window === "undefined") return;
  const json = JSON.stringify(settings);
  window.localStorage.setItem(STORAGE_KEY, json);
  /* Segarkan cache snapshot sebelum event dikirim ke subscriber. */
  cachedRaw = json;
  cachedSnapshot = { ...settings };
  window.dispatchEvent(new Event(SYNC_EVENT));
}

/* ─── Hook utama ───────────────────────────────────────────── */

/**
 * Sinkronisasi konfigurasi provider AI antara komponen React dan localStorage.
 * Perubahan otomatis tersebar ke semua komponen yang memakai hook ini.
 */
export function useAiSettings() {
  /*
   * `useSyncExternalStore` adalah API resmi untuk membaca store eksternal
   * (localStorage) tanpa memicu hydration mismatch:
   *   - getServerSnapshot → DEFAULT_AI_SETTINGS, dipakai saat SSR
   *   - getSnapshot       → nilai localStorage, dipakai setelah mount
   * `hydrated` diturunkan dari nilai snapshot (bukan setState di effect).
   */
  const subscribe = useCallback((onChange: () => void) => {
    const sync = () => onChange();
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) onChange();
    };
    window.addEventListener(SYNC_EVENT, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SYNC_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const getSnapshot = useCallback(() => readSettings(), []);
  const getServerSnapshot = useCallback(() => DEFAULT_AI_SETTINGS, []);

  const settings = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const hydrated = useIsClient();

  const update = useCallback((patch: Partial<AiSettings>) => {
    const next: AiSettings = { ...readSettings(), ...patch };
    writeSettings(next);
    return next;
  }, []);

  const reset = useCallback(() => {
    writeSettings({ ...DEFAULT_AI_SETTINGS });
  }, []);

  return { settings, update, reset, hydrated };
}

/* ─── Konversi ke payload request ──────────────────────────── */

/**
 * Payload yang dikirim ke API route. API key hanya dikirim bila diisi user,
 * supaya server bisa fallback ke environment variable.
 */
export function toAiConfigPayload(settings: AiSettings): AiConfigPayload {
  const provider = getProvider(settings.provider);
  const payload: AiConfigPayload = {
    provider: settings.provider,
    model: settings.model,
  };
  if (settings.apiKey.trim()) payload.apiKey = settings.apiKey.trim();
  if (provider.allowCustomBaseUrl && settings.baseUrl.trim()) {
    payload.baseUrl = settings.baseUrl.trim();
  }
  return payload;
}

/* ─── util status koneksi ──────────────────────────────────── */

export type KeyStatus = "user" | "env" | "missing";

/** Status tanpa memanggil server: hanya melihat apakah key diisi di browser. */
export function getClientKeyStatus(settings: AiSettings): KeyStatus {
  if (settings.apiKey.trim()) return "user";
  return "env";
}

export function formatKeyStatus(status: KeyStatus): string {
  if (status === "user") return "API key dari browser";
  if (status === "env") return "Mencoba API key dari server (.env.local)";
  return "API key belum diisi";
}

/* ─── util deteksi client ──────────────────────────────────── */

const noopSubscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

/**
 * `true` hanya setelah hydration di client.
 * Dipakai sebagai gate untuk UI yang nilainya berasal dari localStorage
 * (API key, provider aktif) agar output SSR dan client tetap identik.
 */
export function useIsClient(): boolean {
  return useSyncExternalStore(noopSubscribe, clientSnapshot, serverSnapshot);
}
