export interface WikiSectionItem {
  id: string;
  title: string;
  content: string;
}

export interface WikiCategory {
  id: string;
  title: string;
  items: WikiSectionItem[];
}

export interface RoadmapTask {
  id: string;
  phaseId: string;
  phaseTitle: string;
  title: string;
  description: string;
  files: string[];
  agentPrompt: string;
  status: "todo" | "in_progress" | "done";
}

export interface WorkspaceData {
  projectName: string;
  projectSlug: string;
  repositoryUrl?: string;
  idea: string;
  generatedAt: string;
  provider?: string;
  model?: string;
  prdMarkdown: string;
  masterPrompt: string;
  wiki: WikiCategory[];
  roadmap: RoadmapTask[];
}

export function slugify(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "")
      .slice(0, 40) || "project-app"
  );
}

export function extractProjectName(idea: string, prdMarkdown: string): string {
  const h1Match = prdMarkdown.match(/^#\s+(?:PRD\s*[-:]?\s*)?([^\n\r]+)/m);
  if (h1Match && h1Match[1].trim()) {
    return h1Match[1].trim().replace(/^PRD\s*[-:]?\s*/i, "");
  }
  const words = idea.trim().split(/\s+/).slice(0, 4).join(" ");
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "Aplikasi AI";
}

export function buildDefaultWiki(
  projectName: string,
  projectSlug: string,
  idea: string,
  _prdMarkdown?: string
): WikiCategory[] {
  void _prdMarkdown;
  const pName = projectName || "Aplikasi";
  const slug = slugify(pName);
  const repoName = projectSlug.includes("/") ? projectSlug : `rafiulm/${slug}`;

  return [
    {
      id: "repo-overview",
      title: "Repository Overview",
      items: [
        {
          id: "tujuan-repository",
          title: "Tujuan repository",
          content: `Repository **${repoName}** merupakan platform terpadu untuk perencanaan dan manajemen pengembangan produk berbasis AI. Sistem ini memfasilitasi alur kerja mulai dari onboarding pengguna, penyusunan spesifikasi (PRD) dan roadmap melalui wizard terpandu, visualisasi workspace (task board, wiki, chat codebase), hingga layanan monetisasi seperti paket langganan, add-on credit, voucher, alur pembayaran manual, dan pemesanan sesi coaching.

### Sasaran Ide Produk:
${idea || "Membangun produk digital berkualitas tinggi bersama AI coding agent."}`,
        },
        {
          id: "peta-app-package",
          title: "Peta app dan package",
          content: `Berdasarkan struktur sistem, repositori ini mengoperasikan satu unit aplikasi fullstack utama:

- \`${slug}-frontend\` **(Fullstack App):** Aplikasi monolitik/fullstack yang mengintegrasikan:
  - **UI / Screens:** Antarmuka pengguna (wizard PRD, public roadmap, task board, dialog pembayaran, halaman coaching, dan portal admin).
  - **API / Routes:** Endpoint perantara untuk onboarding, pembuatan plan/roadmap, fitur add-on, coaching, dan modul administrasi.
  - **Services / Domain Logic:** Logika bisnis untuk pemrosesan AI, kalkulasi monetisasi, dan sinkronisasi workspace.
  - **Data / Schema:** Definisi model data untuk pengguna, plan, roadmap, transaksi, dan prompt.
  - **Workers / Jobs:** Pemrosesan AI asinkron dan sinkronisasi status.`,
        },
        {
          id: "arsitektur-lintas-unit",
          title: "Arsitektur lintas unit",
          content: `Sistem mengadopsi arsitektur modular berlapis:

\`\`\`text
┌─────────────────────────────────────────────────────────────┐
│                 Client Layer (Presentation)                 │
│      React 19 / Next.js App Router, Tailwind CSS, Lucide     │
└───────────────────────────────┬─────────────────────────────┘
                                │ Fetch & Server Actions
┌───────────────────────────────▼─────────────────────────────┐
│                 Application & Domain Services               │
│     AI Model Gateway, Clarification Flow, Schema Guards     │
└───────────────────────────────┬─────────────────────────────┘
                                │ Persistence & State
┌───────────────────────────────▼─────────────────────────────┐
│                     Infrastructure Layer                    │
│      PostgreSQL / Supabase Database, Session Storage        │
└─────────────────────────────────────────────────────────────┘
\`\`\``,
        },
        {
          id: "data-auth-integrasi",
          title: "Data, autentikasi, dan integrasi bersama",
          content: `### Autentikasi
Menggunakan sesi aman berbasis JWT dan OAuth (Google, GitHub, Supabase Auth) dengan proteksi Next.js Middleware.

### Manajemen Data
- **Database Utama:** PostgreSQL / Supabase dengan Row Level Security (RLS) diaktifkan.
- **Client Cache:** Sinkronisasi state lokal untuk preferensi antarmuka pengguna tanpa membebani server.`,
        },
        {
          id: "cara-menjalankan-sistem",
          title: "Cara menjalankan sistem",
          content: `Ikuti langkah berikut untuk menjalankan sistem di lingkungan lokal:

\`\`\`bash
# 1. Clone repository
git clone https://github.com/${repoName}.git
cd ${slug}

# 2. Install dependensi
npm install

# 3. Setup environment variables
cp .env.example .env.local

# 4. Jalankan server pengembangan
npm run dev
\`\`\`

Akses aplikasi di browser pada \`http://localhost:3000\`.`,
        },
      ],
    },
    {
      id: "app-overview",
      title: "App Overview",
      items: [
        {
          id: "arsitektur",
          title: "Arsitektur",
          content: `Aplikasi fullstack ini menggunakan arsitektur modern Next.js App Router:
- **Server Components:** Efisiensi rendering di sisi server untuk waktu muat halaman awal yang cepat.
- **Client Components:** Komponen UI reaktif seperti wizard tanya-jawab, tab switcher, dan task checklist.
- **Strict TypeScript:** Type safe dari request API hingga rendering komponen UI.`,
        },
      ],
    },
    {
      id: "interfaces-user-flows",
      title: "Interfaces & User Flows",
      items: [
        {
          id: "ringkasan",
          title: "Ringkasan",
          content: `Alur penggunaan aplikasi dirancang cepat dan intuitif:
1. **Input Ide Awal:** Pengguna mendeskripsikan ide produk atau aplikasi.
2. **Klarifikasi Interaktif:** AI memberikan 5 pertanyaan tajam untuk memperjelas cakupan teknis dan bisnis.
3. **Workspace Baseline:** Sistem menghasilkan Wiki dokumentasi, Roadmap task board, dan Dokumen PRD lengkap siap coding.`,
        },
        {
          id: "diagram-alur",
          title: "Diagram alur",
          content: `Berikut adalah diagram alur pengguna (User Flow):

\`\`\`text
[Input Ide] ───► [5 Pertanyaan Klarifikasi] ───► [Generate Workspace]
                                                        │
                      ┌─────────────────────────────────┴─────────────────────────────────┐
                      ▼                                 ▼                                 ▼
             [📚 Wiki Dokumentasi]             [📖 Roadmap & Task]               [📋 PRD & Master Prompt]
                      │                                 │                                 │
                      └─────────────────────────────────┴─────────────────────────────────┘
                                                        │
                                                        ▼
                                       [Salin Task Prompt ke Cursor / IDE]
\`\`\``,
        },
      ],
    },

  ];
}

export function buildDefaultRoadmap(
  projectName: string,
  idea: string,
  _prdMarkdown?: string
): RoadmapTask[] {
  void _prdMarkdown;
  const pName = projectName || "Aplikasi";

  return [
    {
      id: "task-1-1",
      phaseId: "phase-1",
      phaseTitle: "Phase 1: Baseline Codebase & Project Setup",
      title: "Inisialisasi Project & Konfigurasi Baseline",
      description: `Setup repository Next.js dengan TypeScript, Tailwind CSS, path aliases, dan lingkungan dev.`,
      files: ["package.json", "tsconfig.json", "src/app/layout.tsx", "src/app/globals.css"],
      agentPrompt: `Sebagai AI Coding Agent, inisialisasi baseline project untuk "${pName}".
Target:
1. Pastikan Next.js App Router aktif dengan TypeScript & Tailwind CSS.
2. Buat struktur folder: src/app/, src/components/, src/lib/, src/types/.
3. Setup skema warna modern dark mode di globals.css.
Verifikasi dengan menjalankan 'npm run dev'.`,
      status: "done",
    },
    {
      id: "task-1-2",
      phaseId: "phase-1",
      phaseTitle: "Phase 1: Baseline Codebase & Project Setup",
      title: "Konfigurasi Database Schema & Environment",
      description: "Setup koneksi Supabase / PostgreSQL, file .env.example, dan client database.",
      files: [".env.example", ".env.local", "src/lib/supabase.ts", "src/types/database.ts"],
      agentPrompt: `Buat koneksi database dan schema types untuk "${pName}".
1. Buat file .env.example berisi konfigurasi database dan API key.
2. Buat helper client di src/lib/supabase.ts.
3. Definisikan tipe entitas utama di src/types/database.ts sesuai spesifikasi PRD.`,
      status: "todo",
    },
    {
      id: "task-2-1",
      phaseId: "phase-2",
      phaseTitle: "Phase 2: Core Architecture & Data Models",
      title: "Implementasi Database Migration & Security RLS",
      description: "Buat script SQL migrasi tabel data lengkap dengan indeks dan kebijakan Row Level Security.",
      files: ["supabase/migrations/001_initial_schema.sql"],
      agentPrompt: `Tulis SQL migration untuk proyek "${pName}" berdasarkan PRD:
1. Buat tabel utama dengan primary key UUID, timestamp, dan foreign key constraints.
2. Aktifkan Row Level Security (RLS) pada semua tabel.
3. Buat policies agar user hanya dapat mengakses data miliknya sendiri via auth.uid().`,
      status: "todo",
    },
    {
      id: "task-3-1",
      phaseId: "phase-3",
      phaseTitle: "Phase 3: Interfaces, User Flows & Screens",
      title: "Rancang Antarmuka Dashboard & Workspace",
      description: `Bangun antarmuka dashboard utama untuk ${pName} lengkap dengan sidebar navigasi dan layout responsif.`,
      files: ["src/app/dashboard/page.tsx", "src/components/Sidebar.tsx", "src/components/Header.tsx"],
      agentPrompt: `Buat antarmuka Dashboard utama untuk "${pName}":
1. Tampilkan navigasi sidebar dengan status aktif, icon Lucide, dan collapsible drawer.
2. Buat komponen Header dengan breadcrumb dan status koneksi pengguna.
3. Pastikan tampilan responsif di mobile dan desktop dengan estetika glassmorphism gelap.`,
      status: "todo",
    },
    {
      id: "task-3-2",
      phaseId: "phase-3",
      phaseTitle: "Phase 3: Interfaces, User Flows & Screens",
      title: "Implementasi Fitur Utama Berdasarkan PRD",
      description: `Implementasikan fungsionalitas inti ${pName} berdasarkan deskripsi ide: "${idea.slice(0, 100)}..."`,
      files: ["src/components/FeatureView.tsx", "src/app/api/action/route.ts"],
      agentPrompt: `Kerjakan fitur inti "${pName}" berdasarkan PRD:
Ide: "${idea}"
1. Buat form dan panel interaktif yang memungkinkan user mengeksekusi fungsionalitas utama.
2. Sambungkan dengan API route di Next.js untuk memproses input pengguna.
3. Tampilkan visual feedback (loading skeleton, pesan sukses, toast error).`,
      status: "todo",
    },
    {
      id: "task-4-1",
      phaseId: "phase-4",
      phaseTitle: "Phase 4: Integrations, API & Business Logic",
      title: "Integrasi Layanan AI / API Eksternal",
      description: "Sambungkan alur kerja ke API LLM atau layanan pihak ketiga dengan sistem retry & error boundary.",
      files: ["src/lib/ai-client.ts", "src/app/api/generate/route.ts"],
      agentPrompt: `Implementasikan integrasi API eksternal / AI untuk "${pName}":
1. Buat client pembungkus API dengan timeout 30 detik dan mekanisme fallback otomatis.
2. Validasi payload request dan response dengan skema Zod.
3. Lindungi kredensial API key agar tidak pernah bocor ke sisi klien.`,
      status: "todo",
    },
    {
      id: "task-5-1",
      phaseId: "phase-5",
      phaseTitle: "Phase 5: Verification, Polish & Deployment",
      title: "Audit Type Checking, Linting, & Build Verification",
      description: "Jalankan static analysis, type checking, dan validasi build production Next.js.",
      files: ["package.json", "README.md"],
      agentPrompt: `Lakukan finalisasi dan audit kode untuk "${pName}":
1. Jalankan 'npm run lint' dan perbaiki semua peringatan eslint/typescript.
2. Jalankan 'npm run build' dan pastikan tidak ada kesalahan kompilasi.
3. Tulis dokumentasi README.md yang jelas mengenai arsitektur, environment variables, dan petunjuk deployment.`,
      status: "todo",
    },
  ];
}

