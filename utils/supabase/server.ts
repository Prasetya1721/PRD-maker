import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Factory server client (App Router). Cookie di-refresh otomatis
 * lewat getAll/setAll — wajib dipakai di Server Component, Server Action,
 * dan Route Handler agar sesi Supabase terbaca/tertulis dengan benar.
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Dipanggil dari Server Component — cookie tidak bisa di-set.
          }
        },
      },
    }
  );
}

/** Alias lama agar import yang sudah ada tidak rusak. */
export const supabase = createClient;

