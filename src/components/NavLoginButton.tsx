"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient, isSupabaseConfigured } from "../../utils/supabase/client";

const primaryStyle: React.CSSProperties = {
  background: "linear-gradient(135deg, oklch(0.65 0.22 290), oklch(0.55 0.22 230))",
  color: "white",
  boxShadow: "0 0 20px oklch(0.65 0.22 290 / 0.35)",
};

function glowOn(e: React.MouseEvent<HTMLElement>) {
  (e.currentTarget as HTMLElement).style.boxShadow =
    "0 0 30px oklch(0.65 0.22 290 / 0.55)";
  (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
}

function glowOff(e: React.MouseEvent<HTMLElement>) {
  (e.currentTarget as HTMLElement).style.boxShadow =
    "0 0 20px oklch(0.65 0.22 290 / 0.35)";
  (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
}

export default function NavLoginButton() {
  const router = useRouter();
  const [configured] = useState(isSupabaseConfigured);
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(() => !isSupabaseConfigured());

  useEffect(() => {
    if (!configured) return;
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setReady(true);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, [configured]);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const cls =
    "px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 inline-block text-center";

  if (!ready) {
    return <span className={cls} style={{ ...primaryStyle, opacity: 0.5 }}>…</span>;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className={cls}
        style={primaryStyle}
        onMouseEnter={glowOn}
        onMouseLeave={glowOff}
      >
        Login
      </Link>
    );
  }

  const label = user.email
    ? user.email.length > 18
      ? `${user.email.slice(0, 16)}…`
      : user.email
    : "Akun";

  return (
    <div className="flex items-center gap-2">
      <span
        title={user.email ?? label}
        className="hidden sm:inline-block max-w-[160px] truncate text-xs font-medium text-[oklch(0.75_0.03_265)]"
      >
        {label}
      </span>
      <button
        onClick={handleLogout}
        className={cls}
        style={{
          background: "oklch(0.16 0.03 265)",
          border: "1px solid oklch(0.26 0.04 290)",
          color: "oklch(0.85 0.02 265)",
        }}
      >
        Logout
      </button>
    </div>
  );
}

