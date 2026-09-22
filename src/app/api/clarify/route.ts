import { generateObject } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { idea } = await req.json();

  if (!idea || typeof idea !== "string") {
    return Response.json({ error: "Missing idea" }, { status: 400 });
  }

  try {
    const result = await generateObject({
      model: openai("gpt-4o"),
      schema: z.object({
        questions: z.array(z.string()),
      }),
      prompt: `Baca ide pengguna ini: "${idea}". Identifikasi maksimal 5 celah logika, asumsi bisnis, atau fitur yang kurang jelas. Hasilkan daftar 5 pertanyaan spesifik dalam format JSON (array of strings) untuk ditanyakan kepada pengguna.`,
    });

    return Response.json({ questions: result.object.questions });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/clarify]", message);
    return Response.json(
      { error: message },
      { status: 500 }
    );
  }
}
