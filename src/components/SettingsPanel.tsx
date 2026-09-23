"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_PROVIDER,
  PROVIDER_LIST,
  getDefaultModel,
  getProvider,
  type AiSettings,
  type ProviderId,
} from "@/lib/ai-providers";
import { toAiConfigPayload, useAiSettings } from "@/lib/useAiSettings";

/* ─── Design tokens (konsisten dengan halaman lain) ─────────── */
const C = {
  panelBg: "oklch(0.11 0.025 265)",
  fieldBg: "oklch(0.10 0.025 265)",
  border: "oklch(0.24 0.03 265)",
  borderFocus: "oklch(0.65 0.22 290 / 0.7)",
  text: "oklch(0.90 0.01 265)",
  textDim: "oklch(0.58 0.04 265)",
  textMuted: "oklch(0.45 0.04 265)",
  accent: "oklch(0.65 0.22 290)",
  ok: "oklch(0.65 0.18 170)",
  err: "oklch(0.68 0.20 25)",
};

const fieldStyle: React.CSSProperties = {
  background: C.fieldBg,
  border: `1px solid ${C.border}`,
  color: C.text,
};

interface TestResult {
  ok: boolean;
  message: string;
  detail?: string;
}

interface ServerStatus {
  id: string;
  hasServerKey: boolean;
  apiKeyVar: string;
  baseUrlVar: string | null;
  hasServerBaseUrl: boolean;
}

/* ─── Sub-komponen: baris label + helper ───────────────────── */
function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-baseline justify-between mb-2 gap-3">
        <label
          className="text-xs font-bold uppercase tracking-wider"
          style={{ color: C.textDim }}
        >
          {label}
        </label>
        {hint && (
          <span className="text-[10px] font-mono" style={{ color: C.textMuted }}>
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

/* ─── Panel utama ──────────────────────────────────────────── */
export default function SettingsPanel() {
  const { settings, update, reset, hydrated } = useAiSettings();

  const provider = useMemo(
    () => getProvider(settings.provider),
    [settings.provider]
  );

  const [apiKeyInput, setApiKeyInput] = useState("");
  const [baseUrlInput, setBaseUrlInput] = useState("");
  const [modelInput, setModelInput] = useState("");
  const [customModel, setCustomModel] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  /*
   * Sinkronkan field input dengan settings tersimpan.
   *
   * Guard HANYA memakai provider, karena semua field lain (model, apiKey,
   * baseUrl) ditulis oleh panel ini sendiri lewat `commit()`. Kalau ikut
   * dimasukkan ke guard, setiap ketikan akan memicu reset result/savedAt dan
   * menimpa input yang sedang diketik.
   *
   * Nilai input di-seed sekali saat provider berganti, lalu `handleProviderChange`
   * dan `reset()` yang menentukan isinya. Perubahan dari tab lain ditangani
   * oleh useAiSettings (sync event) dan akan memicu re-seed via provider bila
   * provider-nya ikut berubah.
   */
  const [syncedProvider, setSyncedProvider] = useState<ProviderId | null>(null);

  if (hydrated && syncedProvider !== settings.provider) {
    setSyncedProvider(settings.provider);
    setApiKeyInput(settings.apiKey);
    setBaseUrlInput(settings.baseUrl || provider.baseUrl || "");
    setModelInput(settings.model);
    setCustomModel(!provider.models.some((m) => m.id === settings.model));
    setResult(null);
    setSavedAt(null);
  }

  /*
   * Auto-simpan setiap perubahan field.
   *
   * Tanpa ini, model/base URL/API key baru hanya tersimpan saat tombol Save
   * ditekan — padahal halaman utama membaca `settings` (localStorage), sehingga
   * model yang dipilih tidak langsung dipakai pada request berikutnya.
   * Menulis segera membuat perubahan langsung berlaku.
   */
  const commit = useCallback(
    (patch: Partial<AiSettings>, opts?: { silent?: boolean }) => {
      update({ ...patch, lastTest: undefined });
      if (!opts?.silent) {
        setSavedAt(new Date().toLocaleTimeString("id-ID"));
      }
    },
    [update]
  );

  /* Ambil info provider mana yang sudah punya key di server (.env.local) */
  useEffect(() => {
    let cancelled = false;
    fetch("/api/models/status")
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data?.providers)) {
          setServerStatus(data.providers as ServerStatus[]);
        }
      })
      .catch(() => {
        /* status server opsional — abaikan bila gagal */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const currentStatus = serverStatus.find((s) => s.id === provider.id);

  /* ─── Ganti provider ────────────────────────────────────── */
  const handleProviderChange = (id: ProviderId) => {
    const next = getProvider(id);
    const firstModel = next.models[0].id;
    // provider + model + baseUrl ditulis bersamaan; guard render akan
    // meng-seed ulang input karena `settings.provider` berubah.
    update({
      provider: id,
      model: firstModel,
      baseUrl: next.baseUrl ?? "",
      lastTest: undefined,
    });
    setResult(null);
  };

  /* ─── Simpan manual (perubahan sebenarnya sudah otomatis) ── */
  const handleSave = () => {
    const finalModel = modelInput.trim() || provider.models[0].id;
    update({
      apiKey: apiKeyInput.trim(),
      baseUrl: provider.allowCustomBaseUrl ? baseUrlInput.trim() : "",
      model: finalModel,
      lastTest: undefined,
    });
    setModelInput(finalModel);
    setSavedAt(new Date().toLocaleTimeString("id-ID"));
  };

  /* ─── Test koneksi ke provider ──────────────────────────── */
  const handleTest = async () => {
    setTesting(true);
    setResult(null);
    const finalModel = modelInput.trim() || provider.models[0].id;

    try {
      const res = await fetch("/api/models/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          toAiConfigPayload({
            provider: settings.provider,
            model: finalModel,
            apiKey: apiKeyInput.trim(),
            baseUrl: provider.allowCustomBaseUrl ? baseUrlInput.trim() : "",
          })
        ),
      });
      const data = await res.json();

      if (data.ok) {
        const msg = `Terhubung ke ${data.provider} · ${data.model}`;
        setResult({
          ok: true,
          message: msg,
          detail: `${data.latencyMs} ms · key: ${
            data.keySource === "browser" ? "browser" : "server (env)"
          } · balasan: "${data.reply}"`,
        });
        update({
          lastTest: { at: new Date().toISOString(), ok: true, message: msg },
        });
      } else {
        const msg = data.error || "Gagal terhubung.";
        setResult({ ok: false, message: msg });
        update({
          lastTest: { at: new Date().toISOString(), ok: false, message: msg },
        });
      }
    } catch {
      setResult({
        ok: false,
        message: "Tidak dapat menghubungi server. Pastikan dev server berjalan.",
      });
    } finally {
      setTesting(false);
    }
  };

  const keySourceLabel = apiKeyInput.trim()
    ? "key dari browser"
    : currentStatus?.hasServerKey
      ? `key dari .env.local (${provider.env.apiKeyVar})`
      : `belum ada key — isi ${provider.env.apiKeyVar} atau tempel di atas`;

  return (
    <div
      className="rounded-2xl p-6 w-full max-w-[min(660px,92vw)] custom-scrollbar overflow-y-auto"
      style={{
        background: C.panelBg,
        border: `1px solid ${C.border}`,
        maxHeight: "calc(100dvh - 4rem)",
      }}
    >

      {/* Header */}
      <div className="mb-6">
        <h3 className="text-base font-bold mb-1" style={{ color: C.text }}>
          🔌 Koneksi Model AI
        </h3>
        <p className="text-xs leading-relaxed" style={{ color: C.textMuted }}>
          Pilih provider, tempel API key, lalu uji koneksi. Key disimpan
          <strong style={{ color: C.textDim }}> hanya di browser Anda</strong>{" "}
          (localStorage).
        </p>
      </div>

      {/* Provider picker */}
      <Field label="Provider" hint={keySourceLabel}>
        <div className="grid grid-cols-2 gap-2">
          {PROVIDER_LIST.map((p) => {
            const active = p.id === settings.provider;
            const hasEnv = serverStatus.find((s) => s.id === p.id)?.hasServerKey;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleProviderChange(p.id)}
                className="text-left rounded-xl px-3 py-2.5 transition-all duration-150"
                style={{
                  background: active ? "oklch(0.65 0.22 290 / 0.14)" : C.fieldBg,
                  border: `1px solid ${
                    active ? "oklch(0.65 0.22 290 / 0.5)" : C.border
                  }`,
                  color: active ? "oklch(0.85 0.10 290)" : C.textDim,
                }}
              >
                <span className="flex items-center gap-2 text-xs font-semibold">
                  <span>{p.icon}</span>
                  <span className="truncate">{p.label}</span>
                  {hasEnv && (
                    <span
                      className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0"
                      style={{
                        background: "oklch(0.45 0.18 170 / 0.2)",
                        color: C.ok,
                      }}
                    >
                      ENV
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
        <p
          className="text-[11px] mt-2 leading-relaxed"
          style={{ color: C.textMuted }}
        >
          {provider.description}
        </p>
      </Field>

      {/* API key */}
      <Field
        label="API Key"
        hint={currentStatus?.apiKeyVar ? `env: ${currentStatus.apiKeyVar}` : undefined}
      >
        <div className="flex gap-2">
          <input
            type={showKey ? "text" : "password"}
            value={apiKeyInput}
            onChange={(e) => {
              const v = e.target.value;
              setApiKeyInput(v);
              commit({ apiKey: v.trim() });
            }}
            placeholder={provider.apiKeyPlaceholder}
            autoComplete="off"
            spellCheck={false}
            className="flex-1 rounded-xl px-3.5 py-2.5 text-sm font-mono outline-none transition-all duration-150"
            style={fieldStyle}
            onFocus={(e) => {
              e.currentTarget.style.border = `1px solid ${C.borderFocus}`;
              e.currentTarget.style.boxShadow = "0 0 18px oklch(0.65 0.22 290 / 0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = `1px solid ${C.border}`;
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <button
            type="button"
            onClick={() => setShowKey((v) => !v)}
            title={showKey ? "Sembunyikan key" : "Tampilkan key"}
            className="px-3 rounded-xl text-xs font-semibold transition-all duration-150 shrink-0"
            style={{
              background: C.fieldBg,
              border: `1px solid ${C.border}`,
              color: C.textDim,
            }}
          >
            {showKey ? "🙈" : "👁️"}
          </button>
        </div>

        {/* Link bantuan + tombol clear */}
        <div className="flex items-center justify-between mt-2 gap-3">
          {provider.keysUrl ? (
            <a
              href={provider.keysUrl}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-medium hover:underline"
              style={{ color: "oklch(0.70 0.15 290)" }}
            >
              🔗 Buat API key di {provider.label} →
            </a>
          ) : (
            <span className="text-[11px]" style={{ color: C.textMuted }}>
              Gunakan key dari penyedia endpoint Anda
            </span>
          )}
          {apiKeyInput && (
            <button
              type="button"
              onClick={() => {
                setApiKeyInput("");
                commit({ apiKey: "" });
              }}
              className="text-[11px] font-medium hover:underline shrink-0"
              style={{ color: C.err }}
            >
              Hapus key
            </button>
          )}
        </div>
      </Field>

      {/* Base URL */}
      {provider.allowCustomBaseUrl && (
        <Field label="Base URL" hint={provider.baseUrl ? "boleh diubah" : "wajib diisi"}>
          <input
            type="url"
            value={baseUrlInput}
            onChange={(e) => {
              const v = e.target.value;
              setBaseUrlInput(v);
              commit({
                baseUrl: provider.allowCustomBaseUrl ? v.trim() : "",
              });
            }}
            placeholder="https://api.example.com/v1"
            spellCheck={false}
            className="w-full rounded-xl px-3.5 py-2.5 text-sm font-mono outline-none transition-all duration-150"
            style={fieldStyle}
            onFocus={(e) => {
              e.currentTarget.style.border = `1px solid ${C.borderFocus}`;
              e.currentTarget.style.boxShadow = "0 0 18px oklch(0.65 0.22 290 / 0.15)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = `1px solid ${C.border}`;
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          {provider.baseUrl && baseUrlInput.trim() !== provider.baseUrl && (
            <button
              type="button"
              onClick={() => {
                const def = provider.baseUrl ?? "";
                setBaseUrlInput(def);
                commit({ baseUrl: def });
              }}
              className="text-[11px] font-medium mt-2 hover:underline"
              style={{ color: "oklch(0.70 0.15 290)" }}
            >
              ↺ Kembalikan default ({provider.baseUrl})
            </button>
          )}
        </Field>
      )}

      {/* Model */}
      <Field
        label="Model"
        hint={customModel ? "mode custom" : "pilih dari daftar"}
      >
        {!customModel ? (
          <select
            value={modelInput}
            onChange={(e) => {
              const v = e.target.value;
              setModelInput(v);
              commit({ model: v });
            }}
            className="w-full rounded-xl px-3.5 py-2.5 text-sm outline-none transition-all duration-150 cursor-pointer"
            style={fieldStyle}
          >
            {provider.models.map((m) => (
              <option key={m.id} value={m.id} style={{ background: C.fieldBg }}>
                {m.label}
                {m.hint ? ` — ${m.hint}` : ""}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={modelInput}
            onChange={(e) => {
              const v = e.target.value;
              setModelInput(v);
              commit({ model: v });
            }}
            placeholder="mis. meta-llama/llama-3.3-70b-instruct"
            spellCheck={false}
            className="w-full rounded-xl px-3.5 py-2.5 text-sm font-mono outline-none transition-all duration-150"
            style={fieldStyle}
          />
        )}

        <button
          type="button"
          onClick={() => {
            const next = !customModel;
            setCustomModel(next);
            const nextModel = next ? "" : provider.models[0].id;
            setModelInput(nextModel);
            commit({ model: nextModel || provider.models[0].id });
          }}
          className="text-[11px] font-medium mt-2 hover:underline"
          style={{ color: "oklch(0.70 0.15 290)" }}
        >
          {customModel
            ? "← Pilih dari daftar model"
            : "✎ Tulis ID model manual (khusus OpenRouter/model baru)"}
        </button>
      </Field>

      {/* Hasil test */}
      {result && (
        <div
          className="rounded-xl p-3.5 mb-5 text-xs leading-relaxed animate-fade-in"
          style={{
            background: result.ok ? "oklch(0.45 0.18 170 / 0.10)" : "oklch(0.68 0.20 25 / 0.10)",
            border: `1px solid ${
              result.ok ? "oklch(0.45 0.18 170 / 0.35)" : "oklch(0.68 0.20 25 / 0.35)"
            }`,
            color: result.ok ? C.ok : C.err,
          }}
        >
          <p className="font-semibold mb-1">
            {result.ok ? "✓ " : "✕ "}
            {result.message}
          </p>
          {result.detail && (
            <p className="font-mono text-[10px] break-words opacity-80">
              {result.detail}
            </p>
          )}
        </div>
      )}

      {/* Aksi */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleTest}
          disabled={testing}
          className="flex-1 min-w-[140px] py-3 rounded-xl text-sm font-bold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: "linear-gradient(135deg, oklch(0.65 0.22 290), oklch(0.55 0.22 230))",
            color: "white",
            boxShadow: "0 0 20px oklch(0.65 0.22 290 / 0.30)",
          }}
        >
          {testing ? "⏳ Menguji..." : "⚡ Test Koneksi"}
        </button>

        <button
          type="button"
          onClick={handleSave}
          className="flex-1 min-w-[120px] py-3 rounded-xl text-sm font-semibold transition-all duration-150"
          style={{
            background: "oklch(0.45 0.18 170 / 0.15)",
            border: "1px solid oklch(0.45 0.18 170 / 0.4)",
            color: C.ok,
          }}
        >
          💾 Simpan
        </button>

        <button
          type="button"
          onClick={() => {
            reset();
            setApiKeyInput("");
            setBaseUrlInput(getProvider(DEFAULT_PROVIDER).baseUrl ?? "");
            setModelInput(getDefaultModel(DEFAULT_PROVIDER));
            setCustomModel(false);
            setResult(null);
            setSavedAt(null);
          }}
          title="Kembalikan ke OpenAI + kosongkan API key"
          className="py-3 px-4 rounded-xl text-sm font-medium transition-all duration-150"
          style={{
            background: C.fieldBg,
            border: `1px solid ${C.border}`,
            color: C.textMuted,
          }}
        >
          ↺ Reset
        </button>
      </div>

      {/* Info bawah */}
      <div className="mt-4 space-y-1">
        {savedAt && (
          <p className="text-[11px]" style={{ color: C.ok }}>
            ✓ Tersimpan otomatis di browser · {savedAt}
          </p>
        )}
        {settings.lastTest && !result && (
          <p className="text-[11px]" style={{ color: C.textMuted }}>
            Test terakhir: {settings.lastTest.ok ? "✓" : "✕"}{" "}
            {settings.lastTest.message} ·{" "}
            {new Date(settings.lastTest.at).toLocaleString("id-ID")}
          </p>
        )}
        <p className="text-[10px] leading-relaxed" style={{ color: C.textMuted }}>
          Jangan lupa klik <strong>Simpan</strong> agar konfigurasi dipakai untuk
          generate berikutnya. API key tidak pernah dikirim ke server pihak
          ketiga selain provider yang Anda pilih.
        </p>
      </div>
    </div>
  );
}




