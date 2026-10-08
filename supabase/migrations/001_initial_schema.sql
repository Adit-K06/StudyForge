-- StudyForge Supabase Initial Schema Migration
-- All tables with Row Level Security (RLS) enforcing user_id = auth.uid()

-- 1. Create Enums
DO $$ BEGIN
  CREATE TYPE task_track AS ENUM ('language', 'dsa', 'project', 'internship');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Days table
CREATE TABLE IF NOT EXISTS public.days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_number INT NOT NULL,
  repo_path TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_day UNIQUE (user_id, day_number)
);

-- 3. Source files table
CREATE TABLE IF NOT EXISTS public.source_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES public.days(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  git_sha TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Tasks table
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_id UUID REFERENCES public.days(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  track task_track NOT NULL DEFAULT 'dsa',
  title TEXT NOT NULL,
  notes TEXT DEFAULT '',
  planned_start TIMESTAMPTZ,
  planned_minutes INT DEFAULT 30,
  done BOOLEAN NOT NULL DEFAULT false,
  done_at TIMESTAMPTZ,
  user_edited BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  source_hash TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Focus sessions table
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  seconds INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Study notes table
CREATE TABLE IF NOT EXISTS public.study_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_id UUID NOT NULL REFERENCES public.days(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  markdown TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_day_topic UNIQUE (user_id, day_id, topic)
);

-- 7. Quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_id UUID NOT NULL REFERENCES public.days(id) ON DELETE CASCADE,
  content_hash TEXT NOT NULL,
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Quiz attempts table
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  per_question_score JSONB NOT NULL DEFAULT '{}'::jsonb,
  total NUMERIC(6, 2) NOT NULL DEFAULT 0,
  max_total NUMERIC(6, 2) NOT NULL DEFAULT 0,
  graded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. User Settings table (for configurable repo root and ignore rules)
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  repo_url TEXT NOT NULL DEFAULT 'https://github.com/adi-training/swe-roadmap',
  repo_branch TEXT NOT NULL DEFAULT 'main',
  root_path TEXT NOT NULL DEFAULT '',
  ignore_folders TEXT[] NOT NULL DEFAULT ARRAY['archive', 'archived'],
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_days_user_day ON public.days(user_id, day_number);
CREATE INDEX IF NOT EXISTS idx_tasks_user_day ON public.tasks(user_id, day_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_done ON public.tasks(user_id, done_at);
CREATE INDEX IF NOT EXISTS idx_tasks_parent ON public.tasks(parent_id);
CREATE INDEX IF NOT EXISTS idx_source_files_day ON public.source_files(day_id);
CREATE INDEX IF NOT EXISTS idx_focus_sessions_user_started ON public.focus_sessions(user_id, started_at);
CREATE INDEX IF NOT EXISTS idx_quizzes_user_day ON public.quizzes(user_id, day_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_quiz ON public.quiz_attempts(user_id, quiz_id);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to allow clean re-runs
DROP POLICY IF EXISTS "Users can manage their own days" ON public.days;
DROP POLICY IF EXISTS "Users can manage their own source files" ON public.source_files;
DROP POLICY IF EXISTS "Users can manage their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can manage their own focus sessions" ON public.focus_sessions;
DROP POLICY IF EXISTS "Users can manage their own study notes" ON public.study_notes;
DROP POLICY IF EXISTS "Users can manage their own quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Users can manage their own quiz attempts" ON public.quiz_attempts;
DROP POLICY IF EXISTS "Users can manage their own settings" ON public.user_settings;

-- RLS Policies (user_id = auth.uid())
CREATE POLICY "Users can manage their own days"
  ON public.days FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own source files"
  ON public.source_files FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own tasks"
  ON public.tasks FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own focus sessions"
  ON public.focus_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own study notes"
  ON public.study_notes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own quizzes"
  ON public.quizzes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own quiz attempts"
  ON public.quiz_attempts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
