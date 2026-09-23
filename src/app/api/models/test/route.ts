import { generateText } from "ai";
import { NextRequest } from "next/server";
import {
  AiConfigError,
  resolveModel,
  toClientError,
} from "@/lib/ai-server";
import { parseAiConfig, readJsonBody } from "@/lib/api-request";

/**
 * POST /api/models/test
 *
 * Validasi bahwa provider + API key + base URL + model bisa dipakai:
 * melakukan request minimal ke provider dan melaporkan statusnya.
 */
export async function POST(req: NextRequest) {
  const body = await readJsonBody(req);

  try {
    const config = parseAiConfig(body);
    const resolved = resolveModel(config);

    const startedAt = Date.now();
    const { text, usage } = await generateText({
      model: resolved.model,
      prompt: 'Balas hanya dengan kata: OK',
      maxOutputTokens: 16,
      temperature: 0,
    });

    return Response.json({
      ok: true,
      provider: resolved.providerLabel,
      providerId: resolved.providerId,
      model: resolved.modelId,
      baseURL: resolved.baseURL,
      keySource: resolved.usingUserKey ? "browser" : resolved.usingEnvKey ? "env" : "none",
      latencyMs: Date.now() - startedAt,
      reply: text.trim().slice(0, 120),
      tokens: usage?.totalTokens ?? null,
    });
  } catch (err: unknown) {
    if (err instanceof AiConfigError) {
      console.warn("[/api/models/test] config:", err.message);
    } else {
      console.error("[/api/models/test]", err);
    }
    const { error, isConfigError } = toClientError(err);
    const rawMsg = err instanceof Error ? err.message : String(err);
    return Response.json(
      { ok: false, error, rawMessage: rawMsg, isConfigError },
      { status: 200 }
    );
  }
}
