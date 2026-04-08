-- All-in-one SQL setup for Neon/Vercel SQL Editor.
-- This file combines the local setup scripts into one executable SQL script.
-- Execution order has been flattened for single-file paste/run.

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';
SET default_table_access_method = heap;

--
-- Init tables
--

CREATE TABLE IF NOT EXISTS public.labs (
    uid text NOT NULL,
    title text NOT NULL,
    md text NOT NULL
);

ALTER TABLE public.labs OWNER TO CURRENT_USER;

CREATE TABLE IF NOT EXISTS public.secrets (
    name text NOT NULL,
    value text NOT NULL
);

ALTER TABLE public.secrets OWNER TO CURRENT_USER;

CREATE TABLE IF NOT EXISTS public.test_cases (
    uid text NOT NULL,
    lab_uid text NOT NULL,
    name text NOT NULL,
    seed_registers text DEFAULT '{}'::text NOT NULL,
    seed_memory text DEFAULT '{}'::text NOT NULL,
    result_registers text DEFAULT '{}'::text NOT NULL,
    result_memory text DEFAULT '{}'::text NOT NULL
);

ALTER TABLE public.test_cases OWNER TO CURRENT_USER;

CREATE TABLE IF NOT EXISTS public.users (
    username text NOT NULL,
    asuid text NOT NULL,
    salt text NOT NULL,
    password_hash text NOT NULL,
    instructor boolean DEFAULT false NOT NULL
);

ALTER TABLE public.users OWNER TO CURRENT_USER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'labs_pkey'
    ) THEN
        ALTER TABLE ONLY public.labs
            ADD CONSTRAINT labs_pkey PRIMARY KEY (uid);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'secrets_pkey'
    ) THEN
        ALTER TABLE ONLY public.secrets
            ADD CONSTRAINT secrets_pkey PRIMARY KEY (name);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'test_cases_pkey'
    ) THEN
        ALTER TABLE ONLY public.test_cases
            ADD CONSTRAINT test_cases_pkey PRIMARY KEY (uid);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_pkey'
    ) THEN
        ALTER TABLE ONLY public.users
            ADD CONSTRAINT users_pkey PRIMARY KEY (username);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_asuid_key'
    ) THEN
        ALTER TABLE ONLY public.users
            ADD CONSTRAINT users_asuid_key UNIQUE (asuid);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'test_cases_lab_uid_fkey'
    ) THEN
        ALTER TABLE ONLY public.test_cases
            ADD CONSTRAINT test_cases_lab_uid_fkey
            FOREIGN KEY (lab_uid) REFERENCES public.labs(uid) ON DELETE CASCADE;
    END IF;
END $$;

--
-- Workspace and lab persistence
--

CREATE TABLE IF NOT EXISTS public.workspaces (
    username text NOT NULL,
    uid text NOT NULL,
    current_project_id text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workspaces OWNER TO CURRENT_USER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'workspaces_pkey'
    ) THEN
        ALTER TABLE ONLY public.workspaces
            ADD CONSTRAINT workspaces_pkey PRIMARY KEY (username);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'workspaces_username_fkey'
    ) THEN
        ALTER TABLE ONLY public.workspaces
            ADD CONSTRAINT workspaces_username_fkey
            FOREIGN KEY (username) REFERENCES public.users(username) ON DELETE CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.workspace_projects (
    id text NOT NULL,
    workspace_username text NOT NULL,
    name text NOT NULL,
    description text NOT NULL DEFAULT '',
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    code text NOT NULL DEFAULT '',
    resp jsonb,
    sim_state jsonb,
    step_index integer NOT NULL DEFAULT 0,
    all_states jsonb NOT NULL DEFAULT '[]'::jsonb,
    register_overrides jsonb NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.workspace_projects OWNER TO CURRENT_USER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'workspace_projects_pkey'
    ) THEN
        ALTER TABLE ONLY public.workspace_projects
            ADD CONSTRAINT workspace_projects_pkey PRIMARY KEY (id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'workspace_projects_workspace_username_fkey'
    ) THEN
        ALTER TABLE ONLY public.workspace_projects
            ADD CONSTRAINT workspace_projects_workspace_username_fkey
            FOREIGN KEY (workspace_username) REFERENCES public.workspaces(username) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS workspace_projects_workspace_username_idx
    ON public.workspace_projects (workspace_username);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'workspaces_current_project_fkey'
    ) THEN
        ALTER TABLE ONLY public.workspaces
            ADD CONSTRAINT workspaces_current_project_fkey
            FOREIGN KEY (current_project_id) REFERENCES public.workspace_projects(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.lab_sessions (
    username text NOT NULL,
    storage_key text NOT NULL,
    uid text NOT NULL,
    lab_uid text,
    version integer NOT NULL DEFAULT 1,
    code text NOT NULL DEFAULT '',
    resp jsonb,
    sim_state jsonb,
    step_index integer NOT NULL DEFAULT 0,
    all_states jsonb NOT NULL DEFAULT '[]'::jsonb,
    register_overrides jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lab_sessions OWNER TO CURRENT_USER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'lab_sessions_pkey'
    ) THEN
        ALTER TABLE ONLY public.lab_sessions
            ADD CONSTRAINT lab_sessions_pkey PRIMARY KEY (username, storage_key);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'lab_sessions_username_fkey'
    ) THEN
        ALTER TABLE ONLY public.lab_sessions
            ADD CONSTRAINT lab_sessions_username_fkey
            FOREIGN KEY (username) REFERENCES public.users(username) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'lab_sessions_lab_uid_fkey'
    ) THEN
        ALTER TABLE ONLY public.lab_sessions
            ADD CONSTRAINT lab_sessions_lab_uid_fkey
            FOREIGN KEY (lab_uid) REFERENCES public.labs(uid) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS lab_sessions_username_idx
    ON public.lab_sessions (username);

--
-- User settings
--

CREATE TABLE IF NOT EXISTS public.user_settings (
    username text NOT NULL,
    editor_font_size integer NOT NULL DEFAULT 14,
    show_help_bubble boolean NOT NULL DEFAULT true,
    open_instructions_by_default boolean NOT NULL DEFAULT true,
    warn_before_reinstate boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT user_settings_editor_font_size_check CHECK (editor_font_size BETWEEN 12 AND 24)
);

ALTER TABLE public.user_settings OWNER TO CURRENT_USER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_settings_pkey'
    ) THEN
        ALTER TABLE ONLY public.user_settings
            ADD CONSTRAINT user_settings_pkey PRIMARY KEY (username);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_settings_username_fkey'
    ) THEN
        ALTER TABLE ONLY public.user_settings
            ADD CONSTRAINT user_settings_username_fkey
            FOREIGN KEY (username) REFERENCES public.users(username) ON DELETE CASCADE;
    END IF;
END $$;

--
-- Courses + enrollments + lab mapping + grading
--

CREATE TABLE IF NOT EXISTS public.courses (
    course_id char(5) NOT NULL CHECK (course_id ~ '^[0-9]{5}$'),
    code text NOT NULL,
    title text NOT NULL,
    term text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.courses OWNER TO CURRENT_USER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'courses_pkey'
    ) THEN
        ALTER TABLE ONLY public.courses
            ADD CONSTRAINT courses_pkey PRIMARY KEY (course_id);
    END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS courses_code_term_idx
    ON public.courses (code, term);

CREATE TABLE IF NOT EXISTS public.course_memberships (
    course_id char(5) NOT NULL,
    username text NOT NULL,
    role text NOT NULL,
    status text NOT NULL DEFAULT 'active',
    added_by text,
    added_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_memberships OWNER TO CURRENT_USER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'course_memberships_pkey'
    ) THEN
        ALTER TABLE ONLY public.course_memberships
            ADD CONSTRAINT course_memberships_pkey PRIMARY KEY (course_id, username);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'course_memberships_course_fkey'
    ) THEN
        ALTER TABLE ONLY public.course_memberships
            ADD CONSTRAINT course_memberships_course_fkey
            FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'course_memberships_user_fkey'
    ) THEN
        ALTER TABLE ONLY public.course_memberships
            ADD CONSTRAINT course_memberships_user_fkey
            FOREIGN KEY (username) REFERENCES public.users(username) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'course_memberships_added_by_fkey'
    ) THEN
        ALTER TABLE ONLY public.course_memberships
            ADD CONSTRAINT course_memberships_added_by_fkey
            FOREIGN KEY (added_by) REFERENCES public.users(username) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS course_memberships_user_idx
    ON public.course_memberships (username);

CREATE TABLE IF NOT EXISTS public.course_labs (
    course_id char(5) NOT NULL,
    lab_uid text NOT NULL,
    assigned_at timestamptz NOT NULL DEFAULT now(),
    position integer NOT NULL DEFAULT 0
);

ALTER TABLE public.course_labs OWNER TO CURRENT_USER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'course_labs_pkey'
    ) THEN
        ALTER TABLE ONLY public.course_labs
            ADD CONSTRAINT course_labs_pkey PRIMARY KEY (course_id, lab_uid);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'course_labs_course_fkey'
    ) THEN
        ALTER TABLE ONLY public.course_labs
            ADD CONSTRAINT course_labs_course_fkey
            FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'course_labs_lab_fkey'
    ) THEN
        ALTER TABLE ONLY public.course_labs
            ADD CONSTRAINT course_labs_lab_fkey
            FOREIGN KEY (lab_uid) REFERENCES public.labs(uid) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS course_labs_lab_idx
    ON public.course_labs (lab_uid);

CREATE TABLE IF NOT EXISTS public.lab_grades (
    course_id char(5) NOT NULL,
    lab_uid text NOT NULL,
    student_username text NOT NULL,
    score numeric,
    max_score numeric,
    attempt_number integer NOT NULL DEFAULT 1,
    graded_at timestamptz NOT NULL DEFAULT now(),
    grader_username text
);

ALTER TABLE public.lab_grades OWNER TO CURRENT_USER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'lab_grades_pkey'
    ) THEN
        ALTER TABLE ONLY public.lab_grades
            ADD CONSTRAINT lab_grades_pkey PRIMARY KEY (course_id, lab_uid, student_username, attempt_number);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'lab_grades_course_fkey'
    ) THEN
        ALTER TABLE ONLY public.lab_grades
            ADD CONSTRAINT lab_grades_course_fkey
            FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'lab_grades_lab_fkey'
    ) THEN
        ALTER TABLE ONLY public.lab_grades
            ADD CONSTRAINT lab_grades_lab_fkey
            FOREIGN KEY (lab_uid) REFERENCES public.labs(uid) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'lab_grades_student_fkey'
    ) THEN
        ALTER TABLE ONLY public.lab_grades
            ADD CONSTRAINT lab_grades_student_fkey
            FOREIGN KEY (student_username) REFERENCES public.users(username) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'lab_grades_grader_fkey'
    ) THEN
        ALTER TABLE ONLY public.lab_grades
            ADD CONSTRAINT lab_grades_grader_fkey
            FOREIGN KEY (grader_username) REFERENCES public.users(username) ON DELETE SET NULL;
    END IF;
END $$;

--
-- Grade attempts
--

CREATE TABLE IF NOT EXISTS public.grade_attempts (
    username text NOT NULL,
    lab_uid text NOT NULL,
    attempts_used integer NOT NULL DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.grade_attempts OWNER TO CURRENT_USER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'grade_attempts_pkey'
    ) THEN
        ALTER TABLE ONLY public.grade_attempts
            ADD CONSTRAINT grade_attempts_pkey PRIMARY KEY (username, lab_uid);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'grade_attempts_username_fkey'
    ) THEN
        ALTER TABLE ONLY public.grade_attempts
            ADD CONSTRAINT grade_attempts_username_fkey
            FOREIGN KEY (username) REFERENCES public.users(username) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'grade_attempts_lab_fkey'
    ) THEN
        ALTER TABLE ONLY public.grade_attempts
            ADD CONSTRAINT grade_attempts_lab_fkey
            FOREIGN KEY (lab_uid) REFERENCES public.labs(uid) ON DELETE CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.grade_attempt_sessions (
    username text NOT NULL,
    lab_uid text NOT NULL,
    grade_session_id text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.grade_attempt_sessions OWNER TO CURRENT_USER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'grade_attempt_sessions_pkey'
    ) THEN
        ALTER TABLE ONLY public.grade_attempt_sessions
            ADD CONSTRAINT grade_attempt_sessions_pkey PRIMARY KEY (username, lab_uid, grade_session_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'grade_attempt_sessions_username_fkey'
    ) THEN
        ALTER TABLE ONLY public.grade_attempt_sessions
            ADD CONSTRAINT grade_attempt_sessions_username_fkey
            FOREIGN KEY (username) REFERENCES public.users(username) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'grade_attempt_sessions_lab_fkey'
    ) THEN
        ALTER TABLE ONLY public.grade_attempt_sessions
            ADD CONSTRAINT grade_attempt_sessions_lab_fkey
            FOREIGN KEY (lab_uid) REFERENCES public.labs(uid) ON DELETE CASCADE;
    END IF;
END $$;

--
-- Course-scoped grade attempts
--

CREATE TABLE IF NOT EXISTS public.course_grade_attempts (
    username text NOT NULL,
    course_id char(5) NOT NULL,
    lab_uid text NOT NULL,
    attempts_used integer NOT NULL DEFAULT 0,
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_grade_attempts OWNER TO CURRENT_USER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'course_grade_attempts_pkey'
    ) THEN
        ALTER TABLE ONLY public.course_grade_attempts
            ADD CONSTRAINT course_grade_attempts_pkey PRIMARY KEY (username, course_id, lab_uid);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'course_grade_attempts_username_fkey'
    ) THEN
        ALTER TABLE ONLY public.course_grade_attempts
            ADD CONSTRAINT course_grade_attempts_username_fkey
            FOREIGN KEY (username) REFERENCES public.users(username) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'course_grade_attempts_course_lab_fkey'
    ) THEN
        ALTER TABLE ONLY public.course_grade_attempts
            ADD CONSTRAINT course_grade_attempts_course_lab_fkey
            FOREIGN KEY (course_id, lab_uid) REFERENCES public.course_labs(course_id, lab_uid) ON DELETE CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.course_grade_attempt_sessions (
    username text NOT NULL,
    course_id char(5) NOT NULL,
    lab_uid text NOT NULL,
    grade_session_id text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_grade_attempt_sessions OWNER TO CURRENT_USER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'course_grade_attempt_sessions_pkey'
    ) THEN
        ALTER TABLE ONLY public.course_grade_attempt_sessions
            ADD CONSTRAINT course_grade_attempt_sessions_pkey PRIMARY KEY (username, course_id, lab_uid, grade_session_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'course_grade_attempt_sessions_username_fkey'
    ) THEN
        ALTER TABLE ONLY public.course_grade_attempt_sessions
            ADD CONSTRAINT course_grade_attempt_sessions_username_fkey
            FOREIGN KEY (username) REFERENCES public.users(username) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'course_grade_attempt_sessions_course_lab_fkey'
    ) THEN
        ALTER TABLE ONLY public.course_grade_attempt_sessions
            ADD CONSTRAINT course_grade_attempt_sessions_course_lab_fkey
            FOREIGN KEY (course_id, lab_uid) REFERENCES public.course_labs(course_id, lab_uid) ON DELETE CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.course_lab_submissions (
    username text NOT NULL,
    course_id char(5) NOT NULL,
    lab_uid text NOT NULL,
    grade_session_id text NOT NULL,
    submitted_code text NOT NULL,
    grade numeric(5,2) NOT NULL,
    passed_tests integer NOT NULL DEFAULT 0,
    total_tests integer NOT NULL,
    passed boolean NOT NULL DEFAULT false,
    error_message text,
    submitted_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT course_lab_submissions_grade_check CHECK (grade >= 0 AND grade <= 100),
    CONSTRAINT course_lab_submissions_counts_check CHECK (passed_tests >= 0 AND total_tests > 0 AND passed_tests <= total_tests)
);

ALTER TABLE public.course_lab_submissions OWNER TO CURRENT_USER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'course_lab_submissions_pkey'
    ) THEN
        ALTER TABLE ONLY public.course_lab_submissions
            ADD CONSTRAINT course_lab_submissions_pkey PRIMARY KEY (username, course_id, lab_uid, grade_session_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'course_lab_submissions_username_fkey'
    ) THEN
        ALTER TABLE ONLY public.course_lab_submissions
            ADD CONSTRAINT course_lab_submissions_username_fkey
            FOREIGN KEY (username) REFERENCES public.users(username) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'course_lab_submissions_course_lab_fkey'
    ) THEN
        ALTER TABLE ONLY public.course_lab_submissions
            ADD CONSTRAINT course_lab_submissions_course_lab_fkey
            FOREIGN KEY (course_id, lab_uid) REFERENCES public.course_labs(course_id, lab_uid) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS course_lab_submissions_lookup_idx
    ON public.course_lab_submissions (username, course_id, lab_uid, submitted_at DESC);

INSERT INTO public.labs (uid, title, md)
VALUES
(
    'seed-course-shared-lab-20260319',
    'Seed Shared Course Lab',
    replace($seed_shared_lab_md$# Seed Shared Course Lab

This sample lab is assigned to more than one course so you can verify that
student progress and grading attempts stay isolated per course.

~~~
# Seed shared course lab
# Add 7 and 8, store the result in x3
addi x1, x0, 7
addi x2, x0, 8
add x3, x1, x2
~~~
$seed_shared_lab_md$, '\n', E'\n')
),
(
    'seed-course-exclusive-lab-20260319',
    'Seed Exclusive Course Lab',
    replace($seed_exclusive_lab_md$# Seed Exclusive Course Lab

This sample lab is assigned to a single seeded course so you can verify that
course-specific lab lists only show what belongs to the selected course.

~~~
# Seed exclusive course lab
# Count down from 3 to 0
addi x5, x0, 3
addi x6, x0, 0
addi x6, x6, 1
addi x5, x5, -1
bne x5, x0, -2
~~~
$seed_exclusive_lab_md$, '\n', E'\n')
)
ON CONFLICT (uid) DO UPDATE
SET title = EXCLUDED.title,
    md = EXCLUDED.md;

WITH seed_course_labs (course_id, lab_uid, position) AS (
    VALUES
        ('48501', '2025120316373801513aa03d83-8962-4322-a6f6-03aa9ffde273', 0),
        ('48501', 'seed-course-shared-lab-20260319', 1),
        ('48501', 'seed-course-exclusive-lab-20260319', 2),
        ('48502', '202512031635030656c5830d1a-8aef-45e4-b062-4b7c1c5531f4', 0),
        ('48502', 'seed-course-shared-lab-20260319', 1),
        ('31001', '2025120316373801513aa03d83-8962-4322-a6f6-03aa9ffde273', 0)
)
INSERT INTO public.course_labs (course_id, lab_uid, position)
SELECT
    scl.course_id::char(5),
    scl.lab_uid,
    scl.position
FROM seed_course_labs scl
JOIN public.courses c
    ON c.course_id = scl.course_id::char(5)
JOIN public.labs l
    ON l.uid = scl.lab_uid
ON CONFLICT (course_id, lab_uid) DO UPDATE
SET position = EXCLUDED.position;

--
-- ASU-ID migration + TA role work
--

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS asuid text;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.users
        WHERE asuid IS NULL
           OR btrim(asuid) = ''
           OR asuid !~ '^[0-9]{10}$'
        OR EXISTS (
            SELECT 1
            FROM (
                SELECT asuid
                FROM public.users
                WHERE asuid ~ '^[0-9]{10}$'
                GROUP BY asuid
                HAVING COUNT(*) > 1
            ) dupes
        )
    ) THEN
        WITH valid_existing AS (
            SELECT
                username,
                asuid,
                row_number() OVER (PARTITION BY asuid ORDER BY username) AS duplicate_rank
            FROM public.users
            WHERE asuid ~ '^[0-9]{10}$'
        ),
        rows_needing_fix AS (
            SELECT u.username
            FROM public.users u
            LEFT JOIN valid_existing v ON v.username = u.username
            WHERE u.asuid IS NULL
               OR btrim(u.asuid) = ''
               OR u.asuid !~ '^[0-9]{10}$'
               OR v.duplicate_rank > 1
        ),
        current_max AS (
            SELECT
                COALESCE(MAX(asuid::bigint), 8999999999::bigint) AS max_asuid
            FROM public.users
            WHERE asuid ~ '^[0-9]{10}$'
        ),
        generated AS (
            SELECT
                r.username,
                (current_max.max_asuid + row_number() OVER (ORDER BY r.username))::text AS generated_asuid
            FROM rows_needing_fix r, current_max
        )
        UPDATE public.users u
        SET asuid = g.generated_asuid
        FROM generated g
        WHERE u.username = g.username;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_asuid_format_check'
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT users_asuid_format_check
            CHECK (asuid ~ '^[0-9]{10}$');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_asuid_key'
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT users_asuid_key UNIQUE (asuid);
    END IF;
END $$;

ALTER TABLE public.users
    ALTER COLUMN asuid SET NOT NULL;

-- Ensure role enum exists and includes 'ta'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'course_role'
    ) THEN
        CREATE TYPE public.course_role AS ENUM ('student', 'instructor', 'ta');
    ELSIF NOT EXISTS (
        SELECT 1
        FROM pg_enum e
        JOIN pg_type t ON t.oid = e.enumtypid
        WHERE t.typname = 'course_role'
          AND e.enumlabel = 'ta'
    ) THEN
        ALTER TYPE public.course_role ADD VALUE 'ta';
    END IF;
END $$;

-- Ensure course_memberships.role uses course_role enum
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'course_memberships'
          AND column_name = 'role'
          AND udt_name <> 'course_role'
    ) THEN
        ALTER TABLE public.course_memberships
            ALTER COLUMN role TYPE public.course_role
            USING role::public.course_role;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.ta_profiles (
    username text NOT NULL,
    first_name text,
    last_name text,
    email text,
    phone text,
    office_location text,
    active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ta_profiles OWNER TO CURRENT_USER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ta_profiles_pkey'
    ) THEN
        ALTER TABLE public.ta_profiles
            ADD CONSTRAINT ta_profiles_pkey PRIMARY KEY (username);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ta_profiles_user_fkey'
    ) THEN
        ALTER TABLE public.ta_profiles
            ADD CONSTRAINT ta_profiles_user_fkey
            FOREIGN KEY (username) REFERENCES public.users(username) ON DELETE CASCADE;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.course_sections (
    section_id bigserial NOT NULL,
    course_id char(5) NOT NULL,
    section_code text NOT NULL,
    section_name text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.course_sections OWNER TO CURRENT_USER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'course_sections_pkey'
    ) THEN
        ALTER TABLE ONLY public.course_sections
            ADD CONSTRAINT course_sections_pkey PRIMARY KEY (section_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'course_sections_course_code_key'
    ) THEN
        ALTER TABLE ONLY public.course_sections
            ADD CONSTRAINT course_sections_course_code_key UNIQUE (course_id, section_code);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'course_sections_course_fkey'
    ) THEN
        ALTER TABLE ONLY public.course_sections
            ADD CONSTRAINT course_sections_course_fkey
            FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON DELETE CASCADE;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS course_sections_course_idx
    ON public.course_sections (course_id);

CREATE TABLE IF NOT EXISTS public.ta_section_enrollments (
    section_id bigint NOT NULL,
    ta_username text NOT NULL,
    status text NOT NULL DEFAULT 'active',
    added_by text,
    added_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ta_section_enrollments OWNER TO CURRENT_USER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ta_section_enrollments_pkey'
    ) THEN
        ALTER TABLE ONLY public.ta_section_enrollments
            ADD CONSTRAINT ta_section_enrollments_pkey PRIMARY KEY (section_id, ta_username);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ta_section_enrollments_section_fkey'
    ) THEN
        ALTER TABLE ONLY public.ta_section_enrollments
            ADD CONSTRAINT ta_section_enrollments_section_fkey
            FOREIGN KEY (section_id) REFERENCES public.course_sections(section_id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ta_section_enrollments_ta_fkey'
    ) THEN
        ALTER TABLE ONLY public.ta_section_enrollments
            ADD CONSTRAINT ta_section_enrollments_ta_fkey
            FOREIGN KEY (ta_username) REFERENCES public.users(username) ON DELETE CASCADE;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ta_section_enrollments_added_by_fkey'
    ) THEN
        ALTER TABLE ONLY public.ta_section_enrollments
            ADD CONSTRAINT ta_section_enrollments_added_by_fkey
            FOREIGN KEY (added_by) REFERENCES public.users(username) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS ta_section_enrollments_ta_idx
    ON public.ta_section_enrollments (ta_username);

CREATE INDEX IF NOT EXISTS ta_section_enrollments_section_idx
    ON public.ta_section_enrollments (section_id);

CREATE OR REPLACE FUNCTION public.validate_ta_section_enrollment()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    section_course_id char(5);
BEGIN
    SELECT cs.course_id
    INTO section_course_id
    FROM public.course_sections cs
    WHERE cs.section_id = NEW.section_id;

    IF section_course_id IS NULL THEN
        RAISE EXCEPTION 'Section % does not exist', NEW.section_id;
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.course_memberships cm
        WHERE cm.course_id = section_course_id
          AND cm.username = NEW.ta_username
          AND cm.role = 'ta'::public.course_role
          AND cm.status = 'active'
    ) THEN
        RAISE EXCEPTION
            'User % must be an active TA in course % before section assignment',
            NEW.ta_username,
            section_course_id;
    END IF;

    RETURN NEW;
END;
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_trigger
        WHERE tgname = 'ta_section_enrollments_validate_ta_role_trg'
          AND tgrelid = 'public.ta_section_enrollments'::regclass
    ) THEN
        CREATE TRIGGER ta_section_enrollments_validate_ta_role_trg
        BEFORE INSERT OR UPDATE
        ON public.ta_section_enrollments
        FOR EACH ROW
        EXECUTE FUNCTION public.validate_ta_section_enrollment();
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.assign_ta_to_section(
    p_section_id bigint,
    p_ta_username text,
    p_added_by text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.ta_section_enrollments (section_id, ta_username, status, added_by, added_at)
    VALUES (p_section_id, p_ta_username, 'active', p_added_by, now())
    ON CONFLICT (section_id, ta_username)
    DO UPDATE SET
        status = 'active',
        added_by = EXCLUDED.added_by,
        added_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.unassign_ta_from_section(
    p_section_id bigint,
    p_ta_username text
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    removed_count integer;
BEGIN
    DELETE FROM public.ta_section_enrollments
    WHERE section_id = p_section_id
      AND ta_username = p_ta_username;

    GET DIAGNOSTICS removed_count = ROW_COUNT;
    RETURN removed_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.unassign_ta_from_all_sections(
    p_ta_username text
)
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
    removed_count integer;
BEGIN
    DELETE FROM public.ta_section_enrollments
    WHERE ta_username = p_ta_username;

    GET DIAGNOSTICS removed_count = ROW_COUNT;
    RETURN removed_count;
END;
$$;

--
