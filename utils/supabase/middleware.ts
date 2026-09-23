import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresh sesi Supabase di setiap request (pola resmi @supabase/ssr).
 * Tanpa middleware ini, cookie auth kedaluwarsa dan `getUser()` di
 * Server Component / Route Handler selalu mengembalikan null
 * meskipun user sudah login di browser.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Supabase belum dikonfigurasi → lewatkan request apa adanya.
  if (!url || !anonKey || url.includes("your_") || anonKey.includes("your_")) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // getUser() sekaligus me-refresh token kedaluwarsa bila perlu.
  await supabase.auth.getUser();

  return supabaseResponse;
}
