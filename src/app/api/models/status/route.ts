import { PROVIDER_LIST } from "@/lib/ai-providers";
import { isPlaceholderKey } from "@/lib/ai-server";

/**
 * GET /api/models/status
 *
 * Memberi tahu client provider mana yang sudah punya API key di server
 * (.env.local). Hanya boolean yang dikirim — API key tidak pernah bocor.
 */
export async function GET() {
  const providers = PROVIDER_LIST.map((provider) => {
    const envKey = (process.env[provider.env.apiKeyVar] ?? "").trim();
    const hasValidKey = envKey.length > 0 && !isPlaceholderKey(envKey);

    return {
      id: provider.id,
      label: provider.label,
      hasServerKey: hasValidKey,
      apiKeyVar: provider.env.apiKeyVar,
      baseUrlVar: provider.env.baseUrlVar ?? null,
      hasServerBaseUrl: provider.env.baseUrlVar
        ? Boolean((process.env[provider.env.baseUrlVar] ?? "").trim())
        : false,
      models: provider.models,
    };
  });

  return Response.json({ providers });
}

