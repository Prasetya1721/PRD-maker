import type { NextRequest } from "next/server";
import { updateSession } from "../utils/supabase/middleware";

/**
 * Proxy refresh sesi Supabase (pengganti `middleware` di Next.js 16).
 * Berkas ini WAJIB di `src/` (sejajar `src/app`) agar terdeteksi.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Refresh sesi untuk semua route kecuali file statis Next.js
     * (_next/static, _next/image, favicon, dsb.).
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
