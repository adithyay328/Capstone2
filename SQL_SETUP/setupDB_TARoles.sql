-- TA role support for course memberships
-- Run this FIFTH, AFTER setupDB_Courses.sql

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type WHERE typname = 'course_role'
    ) THEN
        CREATE TYPE public.course_role AS ENUM ('student', 'instructor', 'ta');
    END IF;
END $$;

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
