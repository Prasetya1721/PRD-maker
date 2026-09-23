import { NextRequest } from "next/server";
import { AiConfigError } from "@/lib/ai-config-error";
import {
  PROVIDER_LIST,
  isProviderId,
  type AiConfigPayload,
  type ProviderId,
} from "@/lib/ai-providers";

/** Batas panjang API key & base URL agar body request tidak disalahgunakan. */
const MAX_API_KEY_LENGTH = 512;
const MAX_BASE_URL_LENGTH = 512;
const MAX_MODEL_LENGTH = 200;

function readString(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

/**
 * Ambil konfigurasi provider dari body request dengan validasi ketat.
 * Semua field opsional — bila kosong, server memakai env/.env.local.
 */
export function parseAiConfig(body: unknown): AiConfigPayload {
  const raw = (body ?? {}) as Record<string, unknown>;

  if (raw.provider !== undefined && raw.provider !== null && raw.provider !== "") {
    if (!isProviderId(raw.provider)) {
      throw new AiConfigError(
        `Provider "${String(raw.provider)}" tidak dikenal. ` +
          `Pilih salah satu: ${PROVIDER_LIST.map((p) => p.id).join(", ")}.`
      );
    }
  }

  const provider: ProviderId | undefined = isProviderId(raw.provider)
    ? raw.provider
    : undefined;

  return {
    provider,
    model: readString(raw.model, MAX_MODEL_LENGTH),
    apiKey: readString(raw.apiKey, MAX_API_KEY_LENGTH),
    baseUrl: readString(raw.baseUrl, MAX_BASE_URL_LENGTH),
  };
}


/** Bungkus body JSON parsing agar error-nya konsisten. */
export async function readJsonBody(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    return {};
  }
}
