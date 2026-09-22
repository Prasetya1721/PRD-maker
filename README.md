# PRD-Genius (PRD-maker)

AI-Powered Product Requirements Document (PRD) Generator. Turn your ideas and rough product concepts into comprehensive, professional PRD documents with AI.

## Features
- **AI Clarification Flow**: Asks smart clarifying questions before generating documents to ensure deep context.
- **Comprehensive PRD Generation**: Generates Executive Summary, User Personas, Core Features & User Stories, Technical Architecture, Acceptance Criteria, and Timeline.
- **Export & Share**: Download PRD as Markdown or copy directly.
- **Supabase Authentication**: Integrated user login & session support.

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env.local`:
```bash
cp .env.local.example .env.local
```
Add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.