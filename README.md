# StudyForge — AI-Driven Autonomous Study Planner

StudyForge is a production-quality, installable PWA study companion built with Next.js (App Router), TypeScript, Tailwind CSS, Supabase (Auth + RLS Postgres), and Google Gemini 2.5 Flash.

It reads your GitHub roadmap repository, dynamically discovers daily curricula, structures tasks and exercises into tailored tracks (Language, DSA, Project, Internship), generates 30-question active recall quizzes, provides interview-depth study notes with PDF export, and tracks focus time with an elapsed-time stopwatch and growing tree visual.

---

## 🚀 Key Features

- 🌲 **Calm Forest Aesthetic**: Rich dark and light modes, high-contrast typography (Inter & Outfit), and 44px+ touch targets.
- 📱 **Mobile-First Responsive Shell**: Bottom navigation on phones and small tablets; ergonomic sidebar on laptops and desktops. Fully installable PWA with custom app icons and manifest.
- 🔄 **Autonomous GitHub Sync**: Discovers curriculum days by regex (`day(\d+)`), supporting both folder structures (`phase1/week1/day1/...`) and flat files (`day1.md`, `day1_extra.cpp`). Automatically ignores `archive`/`archived` folders.
- 🧠 **Dynamic AI Plan Generation**: Zero hardcoded curriculum. Gemini 2.5 Flash turns your files into structured, actionable tasks with specific coding problems and implementation steps.
- 🛡️ **Non-Destructive Safe Merge**: Re-syncing the repository **never overwrites** tasks or notes you customized (`user_edited = true`).
- ⏱️ **Focus Stopwatch & Tree Growth**: Derive elapsed time from system timestamps (survives tab sleep and refreshes). Visual tree grows as you focus. Features built-in Web Audio API synthetic noise generators (Rain / Brown Noise, Forest / Pink Noise, White Noise).
- 📝 **Interview Notes & PDF Download**: Comprehensive deep-dive guides grounded strictly in the day's code, complete with verification banners and 1-click PDF print stylesheets.
- 🎯 **30-Question Active Recall Quizzes**: 15 MCQs (graded deterministically), 8 Coding problems, and 7 Subjective questions evaluated by Gemini against standard rubrics with score history.
- 📊 **Transparent Analytics**: Visual charts with Recharts displaying completion rates, planned vs. actual minutes, activity streaks, and quiz trends with explicit mathematical formulas.
- 💼 **Internship Track Generator**: Provide a brief (e.g. "simple auth system, 4 days") to generate an interviewer-ready system design and build curriculum.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Server Actions, Route Handlers)
- **Language**: TypeScript (strict mode enabled)
- **Styling**: Tailwind CSS (custom forest palette tokens)
- **Database & Auth**: Supabase PostgreSQL + Auth with Row-Level Security (`user_id = auth.uid()`)
- **AI Model**: Google Gemini 2.5 Flash via `@google/generative-ai` with Zod schema validation
- **Data Visualization**: Recharts
- **Testing**: Vitest (14 unit tests covering regex discovery, merge safety, quiz scoring, and analytics formulas)
- **CI/CD**: GitHub Actions (`.github/workflows/ci.yml`)

---

## 📋 Quickstart & Local Setup

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-url>
cd StudyForge
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://sotxtmdrgpsalcdpwhgb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
GITHUB_REPO_URL=https://github.com/adi-training/swe-roadmap
GITHUB_REPO_BRANCH=main
GITHUB_TOKEN=
```

### 3. Run Supabase Database Migration
Open your [Supabase Dashboard SQL Editor](https://supabase.com/dashboard) and run the script located at:
```
/supabase/migrations/001_initial_schema.sql
```
This creates the tables (`days`, `source_files`, `tasks`, `focus_sessions`, `study_notes`, `quizzes`, `quiz_attempts`, `user_settings`) and enables all Row-Level Security policies.

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run Unit Tests
```bash
npm test
```

---

## 📦 Deployment to Vercel

1. Push this repository to GitHub.
2. Import the project into [Vercel](https://vercel.com).
3. Set the Environment Variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `GITHUB_REPO_URL`).
4. Deploy!
