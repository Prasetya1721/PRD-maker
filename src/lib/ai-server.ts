import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";
import { AiConfigError } from "@/lib/ai-config-error";
import {
  getProvider,
  resolveBaseUrl,
  resolveModelId,
  type AiConfigPayload,
} from "@/lib/ai-providers";

/* ─────────────────────────────────────────────────────────────
 * Error khusus yang aman dikembalikan ke client
 * ──────────────────────────────────────────────────────────── */

export { AiConfigError };

/** API key contoh yang tidak boleh dipakai (placeholder dari .env.local.example). */
const PLACEHOLDER_KEYS = [
  "your_openai_api_key",
  "your_api_key_here",
  "sk-xxx",
  "sk-proj-xxx",
  "changeme",
];

export function isPlaceholderKey(key: string): boolean {
  const lower = key.toLowerCase();
  return PLACEHOLDER_KEYS.some((p) => lower.includes(p));
}

/* ─────────────────────────────────────────────────────────────
 * Ekstraksi & Pembersihan JSON (Kebal Markdown & Conversational Wrap)
 * ──────────────────────────────────────────────────────────── */

/**
 * Membersihkan output teks dari model AI agar dapat diparse sebagai JSON.
 * Menghilangkan:
 * 1. Tag reasoning DeepSeek R1 / OpenAI (<think>...</think>)
 * 2. Markdown code block (```json ... ``` atau ``` ... ```)
 * 3. Teks pengantar / penutup percakapan ("Berikut adalah JSON:")
 */
export function cleanJsonText(raw: string): string {
  if (!raw || typeof raw !== "string") return "";

  let cleaned = raw;

  // 1. Hapus tag reasoning model
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

  // 2. Ekstrak isi di dalam markdown code block jika ada
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    cleaned = codeBlockMatch[1].trim();
  }

  // 3. Jika masih ada teks sebelum atau sesudah JSON, ambil substring antara kurung terluar
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");

  // Tentukan apakah objek {} atau array []
  const hasBraces = firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace;
  const hasBrackets = firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket;

  if (hasBraces && (!hasBrackets || firstBrace < firstBracket)) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1).trim();
  } else if (hasBrackets) {
    cleaned = cleaned.substring(firstBracket, lastBracket + 1).trim();
  }

  return cleaned;
}

/**
 * Helper repairText kompatibel dengan AI SDK generateObject
 */
export async function repairJsonText(options: { text: string }): Promise<string | null> {
  const cleaned = cleanJsonText(options.text);
  if (!cleaned) return null;
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {
    return null;
  }
}

/* ─────────────────────────────────────────────────────────────
 * Resolusi config → model AI SDK
 * ──────────────────────────────────────────────────────────── */

export interface ResolvedModel {
  model: LanguageModel;
  providerId: string;
  providerLabel: string;
  modelId: string;
  baseURL: string;
  /** true = API key berasal dari browser (localStorage), bukan env server */
  usingUserKey: boolean;
  /** true = API key berasal dari environment variable server */
  usingEnvKey: boolean;
}

/**
 * Resolve provider + model + API key menjadi instance model AI SDK.
 *
 * Urutan API key:
 *   1. apiKey dari client (localStorage)  → prioritas user
 *   2. environment variable server (mis. OPENROUTER_API_KEY)
 *
 * Provider router pihak ketiga (OpenRouter, ModelRouter, custom) memakai
 * Chat Completions API (`.chat()`), sedangkan OpenAI resmi memakai
 * Responses API default agar fitur terbaru tetap tersedia.
 */
export function resolveModel(config: AiConfigPayload): ResolvedModel {
  const provider = getProvider(config.provider);

  const userKey = config.apiKey?.trim() ?? "";
  const envKey = (process.env[provider.env.apiKeyVar] ?? "").trim();
  const apiKey = userKey || envKey;

  if (!apiKey || isPlaceholderKey(apiKey)) {
    throw new AiConfigError(
      `API key untuk provider ${provider.label} belum diset. ` +
        `Buka Pengaturan (⚙️) lalu tempel API key Anda, ` +
        `atau isi ${provider.env.apiKeyVar} di file .env.local dan restart server.`
    );
  }

  const envBaseUrl = provider.env.baseUrlVar
    ? process.env[provider.env.baseUrlVar]
    : undefined;

  const resolved = resolveBaseUrl(config.provider, config.baseUrl, envBaseUrl);
  if (resolved.error) {
    throw new AiConfigError(resolved.error);
  }

  const modelId = resolveModelId(config.provider, config.model);

  const client = createOpenAI({
    apiKey,
    baseURL: resolved.url,
    name: provider.id,
    // OpenRouter memakai header ini untuk atribusi di dashboard mereka.
    headers:
      provider.id === "openrouter"
        ? {
            "HTTP-Referer":
              process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
              "http://localhost:3000",
            "X-Title": "PRD-Genius",
          }
        : undefined,
  });

  const model = provider.chatCompletionsOnly
    ? client.chat(modelId)
    : client(modelId);

  return {
    model,
    providerId: provider.id,
    providerLabel: provider.label,
    modelId,
    baseURL: resolved.url,
    usingUserKey: Boolean(userKey),
    usingEnvKey: !userKey && Boolean(envKey),
  };
}

/* ─────────────────────────────────────────────────────────────
 * Normalisasi pesan error dari provider
 * ──────────────────────────────────────────────────────────── */

function extractProviderMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return "Unknown error";
}

export interface ClientError {
  error: string;
  isConfigError: boolean;
  status: number;
}

/**
 * Ubah error mentah dari AI SDK / provider menjadi pesan yang ramah user.
 * Pesan asli tetap disertakan agar bisa didiagnosa.
 */
export function toClientError(err: unknown): ClientError {
  if (err instanceof AiConfigError) {
    return { error: err.message, isConfigError: true, status: 400 };
  }

  const raw = extractProviderMessage(err);
  const lower = raw.toLowerCase();

  // 401 / 403 → API key salah
  if (
    lower.includes("401") ||
    lower.includes("unauthorized") ||
    lower.includes("invalid api key") ||
    lower.includes("incorrect api key") ||
    lower.includes("no auth credentials") ||
    lower.includes("authentication")
  ) {
    return {
      error:
        "API key ditolak oleh provider (401/403). Periksa kembali API key dan " +
        `pastikan provider yang dipilih sudah sesuai. Detail: ${raw}`,
      isConfigError: true,
      status: 401,
    };
  }

  // 402 → kredit habis
  if (
    lower.includes("402") ||
    lower.includes("insufficient") ||
    lower.includes("credit")
  ) {
    return {
      error: `Saldo/kredit provider tidak mencukupi. Detail: ${raw}`,
      isConfigError: true,
      status: 402,
    };
  }

  // 404 → model atau base URL salah
  if (
    lower.includes("404") ||
    lower.includes("model not found") ||
    lower.includes("not a valid model") ||
    lower.includes("does not exist")
  ) {
    return {
      error:
        "Model tidak ditemukan di provider/base URL tersebut. " +
        `Pilih model lain di Pengaturan (⚙️). Detail: ${raw}`,
      isConfigError: true,
      status: 404,
    };
  }

  // 429 → rate limit
  if (
    lower.includes("429") ||
    lower.includes("rate limit") ||
    lower.includes("too many requests")
  ) {
    return {
      error: `Rate limit provider tercapai (429). Tunggu sebentar lalu coba lagi. Detail: ${raw}`,
      isConfigError: false,
      status: 429,
    };
  }

  // Masalah koneksi / base URL
  if (
    lower.includes("fetch failed") ||
    lower.includes("enotfound") ||
    lower.includes("econnrefused") ||
    lower.includes("network") ||
    lower.includes("timeout") ||
    lower.includes("aborted")
  ) {
    return {
      error:
        "Tidak dapat terhubung ke provider. Periksa Base URL dan koneksi internet. " +
        `Detail: ${raw}`,
      isConfigError: true,
      status: 502,
    };
  }

  return { error: raw, isConfigError: false, status: 500 };
}


