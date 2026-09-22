import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { idea, answers } = await req.json();

  if (!idea || typeof idea !== "string") {
    return new Response("Missing idea", { status: 400 });
  }

  const answersText = answers && typeof answers === "object"
    ? Object.entries(answers).map(([q, a]) => `Pertanyaan: ${q}\nJawaban: ${a}`).join("\n")
    : "";

  try {
    const result = await generateObject({
      model: openai("gpt-4o"),
      schema: z.object({
        prdMarkdown: z.string(),
        masterPrompt: z.string(),
      }),
      prompt: `Buat dokumen PRD lengkap dari ide berikut dan jawaban klarifikasi.

IDE: "${idea}"
${answersText ? "JAWABAN KLARIFIKASI:\n" + answersText : ""}

Hasilkan objek JSON dengan dua properti:
1. prdMarkdown: Berisi dokumen bisnis lengkap (Executive Summary, Core Features, User Stories, dll.) dalam format Markdown.
2. masterPrompt: Berisi instruksi teknis (Tech Stack, DB Schema, Step-by-step coding) seolah-olah menginstruksikan AI untuk coding aplikasi ini.`,
    });

    return Response.json({
      prdMarkdown: result.object.prdMarkdown,
      masterPrompt: result.object.masterPrompt,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/generate]", message);
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}
