"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import SettingsPanel from "@/components/SettingsPanel";
import { useAiSettings } from "@/lib/useAiSettings";

/**
 * Tombol ⚙️ di navbar + modal pengaturan koneksi model AI.
 *
 * Modal di-render lewat portal ke `document.body` (bukan di dalam <nav>)
 * karena `.glass` memakai `backdrop-filter`, yang menjadikan elemen tersebut
 * containing block bagi `position: fixed` — tanpa portal, overlay modal akan
 * terpotong di dalam kotak navbar.
 */
export default function SettingsModal() {
  const [open, setOpen] = useState(false);
  const { settings, hydrated } = useAiSettings();

  const hasKey = Boolean(settings.apiKey.trim()) || Boolean(settings.lastTest?.ok);

  /* Tutup dengan tombol Escape + kunci scroll body saat modal terbuka */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Pengaturan Koneksi Model AI"
        className="relative flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-all duration-200"
        style={{
          background: "oklch(0.16 0.03 265)",
          border: "1px solid oklch(0.26 0.04 290)",
          color: "oklch(0.72 0.06 265)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.border = "1px solid oklch(0.65 0.22 290 / 0.6)";
          e.currentTarget.style.color = "oklch(0.85 0.10 290)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.border = "1px solid oklch(0.26 0.04 290)";
          e.currentTarget.style.color = "oklch(0.72 0.06 265)";
        }}
      >
        <span>⚙️</span>
        <span className="hidden sm:inline">Model</span>
        {/* Indikator status key */}
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: hydrated && hasKey ? "oklch(0.65 0.18 170)" : "oklch(0.70 0.16 75)",
            boxShadow: hydrated && hasKey
              ? "0 0 8px oklch(0.65 0.18 170 / 0.8)"
              : "0 0 8px oklch(0.70 0.16 75 / 0.6)",
          }}
        />
      </button>

      {open &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 flex items-start justify-center overflow-y-auto p-4 sm:p-8"
            style={{
              zIndex: 9999,
              background: "oklch(0.05 0.02 265 / 0.75)",
              backdropFilter: "blur(6px)",
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setOpen(false);
            }}
            role="dialog"
            aria-modal="true"
            aria-label="Pengaturan koneksi model AI"
          >
            <div className="animate-scale-in w-full flex justify-center pt-9 sm:pt-3">
              <div className="relative w-full flex justify-center">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="absolute top-0 right-0 sm:-top-1 sm:-right-1 z-10 w-8 h-8 rounded-full text-sm font-bold transition-all duration-150"
                  style={{
                    background: "oklch(0.18 0.03 265)",
                    border: "1px solid oklch(0.30 0.04 290)",
                    color: "oklch(0.70 0.04 265)",
                  }}
                  aria-label="Tutup"
                >
                  ✕
                </button>
                <SettingsPanel />
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
