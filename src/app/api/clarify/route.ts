import { generateObject, NoObjectGeneratedError } from "ai";
import { z } from "zod";
import { NextRequest } from "next/server";
import {
  AiConfigError,
  cleanJsonText,
  repairJsonText,
  resolveModel,
  toClientError,
} from "@/lib/ai-server";
import { parseAiConfig, readJsonBody } from "@/lib/api-request";

const questionsSchema = z.object({
  questions: z.array(z.string()),
});

export async function POST(req: NextRequest) {
  const body = await readJsonBody(req);
  const idea = (body as { idea?: unknown }).idea;

  if (!idea || typeof idea !== "string") {
    return Response.json({ error: "Missing idea" }, { status: 400 });
  }

  try {
    const ai = resolveModel(parseAiConfig(body));

    let questions: string[] = [];

    try {
      const result = await generateObject({
        model: ai.model,
        schema: questionsSchema,
        repairText: repairJsonText,
        system:
          "Anda adalah Product Manager handal. Hasilkan ONLY raw RFC-8259 JSON sesuai schema. " +
          "DILARANG menyertakan markdown fences (seperti ```json), dan DILARANG memberikan kata pengantar atau penutup.",
        prompt: `Baca ide pengguna ini: "${idea}". Identifikasi maksimal 5 celah logika, asumsi bisnis, atau fitur yang kurang jelas. Hasilkan daftar 5 pertanyaan spesifik dalam format JSON (array of strings) untuk ditanyakan kepada pengguna.`,
      });
      questions = result.object.questions;
    } catch (genErr) {
      // Penyelamatan kuota jika model mengembalikan NoObjectGeneratedError
      if (NoObjectGeneratedError.isInstance(genErr) && genErr.text) {
        console.warn("[/api/clarify] Memulihkan JSON dari NoObjectGeneratedError raw text...");
        const cleaned = cleanJsonText(genErr.text);
        try {
          const parsed = JSON.parse(cleaned);
          const validated = questionsSchema.safeParse(parsed);
          if (validated.success && validated.data.questions?.length > 0) {
            questions = validated.data.questions;
          } else if (Array.isArray(parsed)) {
            questions = parsed.map(String);
          } else {
            throw genErr;
          }
        } catch {
          throw genErr;
        }
      } else {
        throw genErr;
      }
    }

    return Response.json({
      questions,
      meta: { provider: ai.providerLabel, model: ai.modelId },
    });
  } catch (err: unknown) {
    if (err instanceof AiConfigError) {
      console.warn("[/api/clarify] config:", err.message);
    } else {
      console.error("[/api/clarify]", err);
    }
    const { error, isConfigError, status } = toClientError(err);
    return Response.json({ error, isConfigError }, { status });
  }
}


