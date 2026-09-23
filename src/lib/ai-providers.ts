/**
 * Provider registry — pusat definisi semua LLM provider yang didukung
 * (OpenAI, OpenRouter, ModelRouter, dan endpoint OpenAI-compatible lain).
 *
 * Aman di-import dari client maupun server (tidak mengakses process.env di sini).
 */

export type ProviderId =
  | "openai"
  | "openrouter"
  | "modelrouter"
  | "openai-compatible";

export interface ProviderModel {
  id: string;
  label: string;
  /** Catatan tambahan untuk ditampilkan di UI */
  hint?: string;
}

export interface ProviderEnv {
  /** Nama environment variable untuk API key, mis. OPENROUTER_API_KEY */
  apiKeyVar: string;
  /** Nama environment variable untuk override base URL (opsional) */
  baseUrlVar?: string;
}

export interface ProviderMeta {
  id: ProviderId;
  label: string;
  /** Emoji singkat untuk badge di UI */
  icon: string;
  description: string;
  /** Base URL default; null = custom (harus diisi user) */
  baseUrl: string | null;
  /** Halaman tempat user membuat API key */
  keysUrl: string;
  /** Placeholder contoh format API key */
  apiKeyPlaceholder: string;
  /** true = provider hanya mendukung Chat Completions API (bukan Responses API) */
  chatCompletionsOnly: boolean;
  /** User boleh menimpa base URL (berguna untuk self-host / proxy) */
  allowCustomBaseUrl: boolean;
  env: ProviderEnv;
  models: ProviderModel[];
}

/* ─────────────────────────────────────────────────────────────
 * Registry
 * ──────────────────────────────────────────────────────────── */

export const PROVIDERS: Record<ProviderId, ProviderMeta> = {
  openai: {
    id: "openai",
    label: "OpenAI",
    icon: "🟢",
    description: "Provider resmi OpenAI (GPT-4o, o3-mini).",
    baseUrl: "https://api.openai.com/v1",
    keysUrl: "https://platform.openai.com/api-keys",
    apiKeyPlaceholder: "sk-proj-...",
    chatCompletionsOnly: false,
    allowCustomBaseUrl: true,
    env: { apiKeyVar: "OPENAI_API_KEY", baseUrlVar: "OPENAI_BASE_URL" },
    models: [
      { id: "gpt-4o", label: "GPT-4o", hint: "Default · seimbang & akurat" },
      { id: "gpt-4o-mini", label: "GPT-4o mini", hint: "Paling hemat" },
      { id: "gpt-4.1", label: "GPT-4.1", hint: "Konteks panjang" },
      { id: "o3-mini", label: "o3-mini", hint: "Reasoning murah" },
    ],
  },

  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    icon: "🌐",
    description:
      "Satu API key untuk 300+ model (OpenAI, Anthropic, Google, Meta, DeepSeek).",
    baseUrl: "https://openrouter.ai/api/v1",
    keysUrl: "https://openrouter.ai/keys",
    apiKeyPlaceholder: "sk-or-v1-...",
    chatCompletionsOnly: true,
    allowCustomBaseUrl: false,
    env: {
      apiKeyVar: "OPENROUTER_API_KEY",
      baseUrlVar: "OPENROUTER_BASE_URL",
    },
    models: [
      { id: "openai/gpt-4o", label: "GPT-4o", hint: "Default · stabil" },
      { id: "openai/gpt-4o-mini", label: "GPT-4o mini", hint: "Sangat hemat" },
      {
        id: "anthropic/claude-sonnet-4.5",
        label: "Claude Sonnet 4.5",
        hint: "Terbaik untuk dokumen panjang",
      },
      {
        id: "google/gemini-2.5-pro",
        label: "Gemini 2.5 Pro",
        hint: "Konteks sangat panjang",
      },
      {
        id: "deepseek/deepseek-chat",
        label: "DeepSeek V3",
        hint: "Termurah untuk PRD",
      },
      {
        id: "meta-llama/llama-3.3-70b-instruct",
        label: "Llama 3.3 70B",
        hint: "Open source",
      },
      { id: "qwen/qwen-2.5-72b-instruct", label: "Qwen 2.5 72B" },
      { id: "x-ai/grok-4", label: "Grok 4" },
    ],
  },

  modelrouter: {
    id: "modelrouter",
    label: "ModelRouter",
    icon: "🔀",
    description:
      "Gateway multi-model OpenAI-compatible — satu API key untuk semua model.",
    baseUrl: "https://api.modelrouter.ai/v1",
    keysUrl: "https://modelrouter.ai/dashboard",
    apiKeyPlaceholder: "mr-...",
    chatCompletionsOnly: true,
    allowCustomBaseUrl: true,
    env: {
      apiKeyVar: "MODELROUTER_API_KEY",
      baseUrlVar: "MODELROUTER_BASE_URL",
    },
    models: [
      { id: "gpt-4o", label: "GPT-4o", hint: "Default" },
      { id: "gpt-4o-mini", label: "GPT-4o mini", hint: "Hemat" },
      { id: "claude-sonnet-4.5", label: "Claude Sonnet 4.5" },
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { id: "deepseek-chat", label: "DeepSeek V3" },
      { id: "llama-3.3-70b", label: "Llama 3.3 70B" },
    ],
  },

  "openai-compatible": {
    id: "openai-compatible",
    label: "Custom / OpenAI-Compatible",
    icon: "🛠️",
    description:
      "Endpoint OpenAI-compatible lain: Groq, Together, Fireworks, vLLM, LM Studio, Ollama, dsb.",
    baseUrl: null,
    keysUrl: "",
    apiKeyPlaceholder: "gsk_... / sk-... / token Anda",
    chatCompletionsOnly: true,
    allowCustomBaseUrl: true,
    env: {
      apiKeyVar: "CUSTOM_API_KEY",
      baseUrlVar: "CUSTOM_BASE_URL",
    },
    models: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (Groq)" },
      { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B (Groq)" },
      {
        id: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
        label: "Llama 3.3 Turbo (Together)",
      },
      { id: "qwen2.5:72b", label: "Qwen 2.5 72B (Ollama / LM Studio)" },
    ],
  },
};

export const PROVIDER_LIST: ProviderMeta[] = Object.values(PROVIDERS);

export const DEFAULT_PROVIDER: ProviderId = "openai";
export const DEFAULT_MODEL = PROVIDERS.openai.models[0].id;

/* ─────────────────────────────────────────────────────────────
 * Config yang dikirim dari client → server
 * ──────────────────────────────────────────────────────────── */

export interface AiConfigPayload {
  provider?: ProviderId;
  model?: string;
  /** API key dari input user (localStorage). Kosong → pakai env server. */
  apiKey?: string;
  /** Base URL custom (hanya untuk provider yang allowCustomBaseUrl) */
  baseUrl?: string;
}

/** Bentuk config yang disimpan di localStorage browser. */
export interface AiSettings {
  provider: ProviderId;
  model: string;
  apiKey: string;
  baseUrl: string;
  /** Hasil test koneksi terakhir */
  lastTest?: {
    at: string;
    ok: boolean;
    message: string;
  };
}

export function isProviderId(value: unknown): value is ProviderId {
  return typeof value === "string" && value in PROVIDERS;
}

/** Ambil metadata provider, fallback ke default bila id tidak dikenal. */
export function getProvider(id: unknown): ProviderMeta {
  return isProviderId(id) ? PROVIDERS[id] : PROVIDERS[DEFAULT_PROVIDER];
}

/** Model default untuk sebuah provider. */
export function getDefaultModel(id: unknown): string {
  return getProvider(id).models[0].id;
}

/** Model yang dipakai bila model kosong pada request. */
export function resolveModelId(id: unknown, model?: string | null): string {
  if (model && model.trim()) return model.trim();
  return getDefaultModel(id);
}

/** Label panjang untuk badge, mis. "OpenRouter · GPT-4o". */
export function describeModel(
  id: unknown,
  model?: string | null,
  customBaseUrl?: string | null
): string {
  const provider = getProvider(id);
  const modelId = resolveModelId(id, model);
  const known = provider.models.find((m) => m.id === modelId);
  const modelLabel = known ? known.label : modelId;
  if (provider.id === "openai-compatible" && customBaseUrl) {
    let host = customBaseUrl;
    try {
      host = new URL(customBaseUrl).host;
    } catch {
      /* bukan URL valid — tampilkan apa adanya */
    }
    return `${host} · ${modelLabel}`;
  }
  return `${provider.label} · ${modelLabel}`;
}

/* ─────────────────────────────────────────────────────────────
 * Sanitasi base URL — dipakai server sebelum request keluar
 * ──────────────────────────────────────────────────────────── */

export interface ResolvedBaseUrl {
  url: string;
  /** Pesan error bila base URL tidak valid / tidak diizinkan */
  error?: string;
}

/**
 * Tentukan base URL final: custom (bila diizinkan) → env → default provider.
 * Hanya http/https yang diterima agar tidak bisa dipakai ke skema aneh.
 */
export function resolveBaseUrl(
  providerId: unknown,
  customBaseUrl?: string | null,
  envValue?: string | null
): ResolvedBaseUrl {
  const provider = getProvider(providerId);
  const candidate =
    (provider.allowCustomBaseUrl ? customBaseUrl?.trim() : "") ||
    (envValue?.trim() ?? "") ||
    provider.baseUrl ||
    "";

  if (!candidate) {
    return {
      url: "",
      error: `Base URL untuk provider ${provider.label} belum diisi.`,
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { url: "", error: `Base URL tidak valid: "${candidate}"` };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return {
      url: "",
      error: `Base URL harus memakai http:// atau https:// (dapat "${parsed.protocol}").`,
    };
  }

  // Buang trailing slash agar konsisten saat provider menambah path.
  return { url: candidate.replace(/\/+$/, "") };
}

