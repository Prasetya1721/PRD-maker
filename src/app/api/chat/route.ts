import { generateText } from "ai";
import { NextRequest } from "next/server";
import { AiConfigError, resolveModel, toClientError } from "@/lib/ai-server";
import { parseAiConfig, readJsonBody } from "@/lib/api-request";

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function POST(req: NextRequest) {
  const body = await readJsonBody(req);
  const { messages, context } = body as {
    messages?: ChatMessage[];
    context?: {
      projectName?: string;
      idea?: string;
      prdMarkdown?: string;
    };
  };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "Missing messages" }, { status: 400 });
  }

  try {
    const ai = resolveModel(parseAiConfig(body));

    const projectContext = context
      ? `PROYEK: ${context.projectName || "Aplikasi"}\nIDE: ${context.idea || ""}\n\nRINGKASAN PRD:\n${
          context.prdMarkdown ? context.prdMarkdown.slice(0, 3000) : "N/A"
        }`
      : "Konteks proyek belum tersedia.";

    const systemPrompt = `Anda adalah Staff AI Architect & Lead Engineer untuk proyek ini.
Tugas Anda adalah membantu developer menjawab pertanyaan teknis, merancang arsitektur kode, memberikan potongan script/schema, dan menulis prompt presisi untuk AI coding agent (Cursor, Claude Code, Windsurf, Copilot, Cline) berdasarkan PRD & spesifikasi proyek berikut:

---
${projectContext}
---

Aturan respons:
1. Berikan jawaban yang to-the-point, praktis, dan dapat langsung diimplementasikan.
2. Gunakan markdown yang rapi dengan code block dan bahasa yang ramah & profesional.
3. Selalu prioritaskan arsitektur modern, type safety, dan best practices.`;

    const chatHistory = messages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const result = await generateText({
      model: ai.model,
      system: systemPrompt,
      messages: chatHistory,
    });

    return Response.json({
      content: result.text,
      meta: {
        provider: ai.providerLabel,
        providerId: ai.providerId,
        model: ai.modelId,
      },
    });
  } catch (err: unknown) {
    if (err instanceof AiConfigError) {
      console.warn("[/api/chat] config:", err.message);
    } else {
      console.error("[/api/chat]", err);
    }
    const { error, isConfigError, status } = toClientError(err);
    return Response.json({ error, isConfigError }, { status });
  }
}
