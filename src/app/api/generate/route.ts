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
import {
  buildDefaultRoadmap,
  buildDefaultWiki,
  extractProjectName,
  slugify,
} from "@/lib/workspace-generator";


const prdSchema = z.object({
  prdMarkdown: z.string(),
  masterPrompt: z.string(),
});

export async function POST(req: NextRequest) {
  const body = await readJsonBody(req);
  const { idea, answers } = body as {
    idea?: unknown;
    answers?: unknown;
  };

  if (!idea || typeof idea !== "string") {
    return Response.json({ error: "Missing idea" }, { status: 400 });
  }

  const answersText =
    answers && typeof answers === "object"
      ? Object.entries(answers as Record<string, unknown>)
          .map(([q, a]) => `Pertanyaan: ${q}\nJawaban: ${String(a)}`)
          .join("\n")
      : "";

  try {
    const ai = resolveModel(parseAiConfig(body));

    let output = {
      prdMarkdown: "",
      masterPrompt: "",
    };

    try {
      const result = await generateObject({
        model: ai.model,
        schema: prdSchema,
        repairText: repairJsonText,
        system:
          "Anda adalah Product Manager dan Software Architect kelas dunia. " +
          "Hasilkan ONLY raw RFC-8259 JSON sesuai schema { prdMarkdown: string, masterPrompt: string }. " +
          "DILARANG membungkus output dengan markdown code fence (seperti ```json), dan DILARANG memberikan kata pengantar atau penutup.",
        prompt: `Buat dokumen PRD lengkap dari ide berikut dan jawaban klarifikasi.

IDE: "${idea}"
${answersText ? "JAWABAN KLARIFIKASI:\n" + answersText : ""}

Hasilkan objek JSON dengan dua properti:
1. prdMarkdown: Berisi dokumen bisnis lengkap (Executive Summary, Core Features, User Stories, dll.) dalam format Markdown.
2. masterPrompt: Berisi instruksi teknis (Tech Stack, DB Schema, Step-by-step coding) seolah-olah menginstruksikan AI untuk coding aplikasi ini.`,
      });
      output = result.object;
    } catch (genErr) {
      // Penyelamatan kuota jika AI SDK gagal parse respons
      if (NoObjectGeneratedError.isInstance(genErr) && genErr.text) {
        console.warn("[/api/generate] Memulihkan PRD dari NoObjectGeneratedError raw text...");
        const rawText = genErr.text;
        const cleaned = cleanJsonText(rawText);
        let recovered = false;

        try {
          const parsed = JSON.parse(cleaned);
          const validated = prdSchema.safeParse(parsed);
          if (validated.success) {
            output = validated.data;
            recovered = true;
          }
        } catch {
          // JSON parse gagal, cek apakah model menghasilkan markdown PRD langsung
        }

        if (!recovered) {
          // Jika model menghasilkan markdown biasa tanpa schema JSON, selamatkan teksnya sebagai PRD
          if (rawText.length > 50) {
            output = {
              prdMarkdown: rawText,
              masterPrompt:
                "Gunakan PRD di atas untuk membangun aplikasi dengan tech stack Next.js App Router, Tailwind CSS, TypeScript, dan Supabase.",
            };
            recovered = true;
          } else {
            throw genErr;
          }
        }
      } else {
        throw genErr;
      }
    }

    const projectName = extractProjectName(idea, output.prdMarkdown);
    const cleanSlug = slugify(projectName);
    const projectSlug = `rafiulm/${cleanSlug}`;
    const wiki = buildDefaultWiki(projectName, projectSlug, idea, output.prdMarkdown);
    const roadmap = buildDefaultRoadmap(projectName, idea, output.prdMarkdown);

    return Response.json({
      projectName,
      projectSlug,
      prdMarkdown: output.prdMarkdown,
      masterPrompt: output.masterPrompt,
      wiki,
      roadmap,
      meta: {
        provider: ai.providerLabel,
        providerId: ai.providerId,
        model: ai.modelId,
      },
    });
  } catch (err: unknown) {
    if (err instanceof AiConfigError) {
      console.warn("[/api/generate] config:", err.message);
    } else {
      console.error("[/api/generate]", err);
    }
    const { error, isConfigError, status } = toClientError(err);
    return Response.json({ error, isConfigError }, { status });
  }
}


