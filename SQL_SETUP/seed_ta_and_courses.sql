-- Seed data for courses + TA accounts + section assignments
-- Run AFTER:
--   1) setupDB_Init.sql
--   2) setupDB_ASUID.sql
--   3) setupDB_Courses.sql
--   4) setupDB_TARoles.sql
--
-- Seeded account password for rows inserted here:
--   ta123456
-- (Argon2id hash below; same password used for all seeded users)

-- -------------------------------------------------------------------
-- 1) Seed users (1 instructor, 3 TAs, 3 students)
-- -------------------------------------------------------------------
WITH seed_users (username, asuid, instructor, salt, password_hash) AS (
    VALUES
        ('instructor_seed', '1219000001', true,  'seed_salt', '$argon2id$v=19$m=65536,t=3,p=4$MDWUiQd/aYY3aWDHyAQUTA$zH08wsnPASz/Jl0Mky4SUfJaMJyHARUKzrWyMg2+/90'),
        ('ta_alex',         '1219000101', false, 'seed_salt', '$argon2id$v=19$m=65536,t=3,p=4$MDWUiQd/aYY3aWDHyAQUTA$zH08wsnPASz/Jl0Mky4SUfJaMJyHARUKzrWyMg2+/90'),
        ('ta_briana',       '1219000102', false, 'seed_salt', '$argon2id$v=19$m=65536,t=3,p=4$MDWUiQd/aYY3aWDHyAQUTA$zH08wsnPASz/Jl0Mky4SUfJaMJyHARUKzrWyMg2+/90'),
        ('ta_chris',        '1219000103', false, 'seed_salt', '$argon2id$v=19$m=65536,t=3,p=4$MDWUiQd/aYY3aWDHyAQUTA$zH08wsnPASz/Jl0Mky4SUfJaMJyHARUKzrWyMg2+/90'),
        ('student_seed_1',  '1219000201', false, 'seed_salt', '$argon2id$v=19$m=65536,t=3,p=4$MDWUiQd/aYY3aWDHyAQUTA$zH08wsnPASz/Jl0Mky4SUfJaMJyHARUKzrWyMg2+/90'),
        ('student_seed_2',  '1219000202', false, 'seed_salt', '$argon2id$v=19$m=65536,t=3,p=4$MDWUiQd/aYY3aWDHyAQUTA$zH08wsnPASz/Jl0Mky4SUfJaMJyHARUKzrWyMg2+/90'),
        ('student_seed_3',  '1219000203', false, 'seed_salt', '$argon2id$v=19$m=65536,t=3,p=4$MDWUiQd/aYY3aWDHyAQUTA$zH08wsnPASz/Jl0Mky4SUfJaMJyHARUKzrWyMg2+/90')
),
eligible_users AS (
    SELECT su.*
    FROM seed_users su
    WHERE NOT EXISTS (
        SELECT 1
        FROM public.users u
        WHERE u.username = su.username
           OR u.asuid = su.asuid
    )
)
INSERT INTO public.users (username, asuid, salt, password_hash, instructor)
SELECT username, asuid, salt, password_hash, instructor
FROM eligible_users;

-- Optional TA profile info
INSERT INTO public.ta_profiles (username, first_name, last_name, email, phone, office_location, active)
VALUES
    ('ta_alex',   'Alex',   'Nguyen', 'ta.alex@example.edu',   '480-555-0101', 'BYENG 210', true),
    ('ta_briana', 'Briana', 'Patel',  'ta.briana@example.edu', '480-555-0102', 'BYENG 212', true),
    ('ta_chris',  'Chris',  'Kim',    'ta.chris@example.edu',  '480-555-0103', 'BYENG 214', true)
ON CONFLICT (username) DO UPDATE
SET first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    office_location = EXCLUDED.office_location,
    active = EXCLUDED.active,
    updated_at = now();

-- -------------------------------------------------------------------
-- 2) Seed courses
-- -------------------------------------------------------------------
INSERT INTO public.courses (course_id, code, title, term)
VALUES
    ('48501', 'CSE485', 'Capstone Project I', 'Spring 2026'),
    ('48502', 'CSE486', 'Capstone Project II', 'Spring 2026'),
    ('31001', 'CSE310', 'Data Structures and Algorithms', 'Spring 2026')
ON CONFLICT (course_id) DO UPDATE
SET code = EXCLUDED.code,
    title = EXCLUDED.title,
    term = EXCLUDED.term,
    updated_at = now();

-- -------------------------------------------------------------------
-- 3) Seed memberships (instructor / ta / student)
-- -------------------------------------------------------------------
INSERT INTO public.course_memberships (course_id, username, role, status, added_by, added_at)
VALUES
    -- instructors
    ('48501', 'instructor_seed', 'instructor', 'active', NULL, now()),
    ('48502', 'instructor_seed', 'instructor', 'active', NULL, now()),
    ('31001', 'instructor_seed', 'instructor', 'active', NULL, now()),

    -- TAs
    ('48501', 'ta_alex',   'ta', 'active', NULL, now()),
    ('48501', 'ta_briana', 'ta', 'active', NULL, now()),
    ('48502', 'ta_briana', 'ta', 'active', NULL, now()),
    ('31001', 'ta_chris',  'ta', 'active', NULL, now()),

    -- students
    ('48501', 'student_seed_1', 'student', 'active', NULL, now()),
    ('48501', 'student_seed_2', 'student', 'active', NULL, now()),
    ('48502', 'student_seed_2', 'student', 'active', NULL, now()),
    ('31001', 'student_seed_3', 'student', 'active', NULL, now())
ON CONFLICT (course_id, username) DO UPDATE
SET role = EXCLUDED.role,
    status = EXCLUDED.status,
    added_by = EXCLUDED.added_by,
    added_at = now();

-- -------------------------------------------------------------------
-- 4) Seed sections
-- -------------------------------------------------------------------
INSERT INTO public.course_sections (course_id, section_code, section_name)
VALUES
    ('48501', 'A', 'CSE485 Section A'),
    ('48501', 'B', 'CSE485 Section B'),
    ('48502', 'A', 'CSE486 Section A'),
    ('31001', 'A', 'CSE310 Section A'),
    ('31001', 'B', 'CSE310 Section B')
ON CONFLICT (course_id, section_code) DO UPDATE
SET section_name = EXCLUDED.section_name,
    updated_at = now();

-- -------------------------------------------------------------------
-- 5) Seed TA section assignments
--    (demonstrates one TA assigned to multiple sections)
-- -------------------------------------------------------------------
INSERT INTO public.ta_section_enrollments (section_id, ta_username, status, added_by, added_at)
SELECT
    cs.section_id,
    x.ta_username,
    'active' AS status,
    NULL AS added_by,
    now() AS added_at
FROM (
    VALUES
        ('48501', 'A', 'ta_alex'),
        ('48501', 'B', 'ta_alex'),   -- alex has multiple sections in same course
        ('48501', 'A', 'ta_briana'),
        ('48502', 'A', 'ta_briana'), -- briana spans multiple courses
        ('31001', 'A', 'ta_chris'),
        ('31001', 'B', 'ta_chris')   -- chris has multiple sections
) AS x(course_id, section_code, ta_username)
JOIN public.course_sections cs
  ON cs.course_id = x.course_id
 AND cs.section_code = x.section_code
ON CONFLICT (section_id, ta_username) DO UPDATE
SET status = EXCLUDED.status,
    added_by = EXCLUDED.added_by,
    added_at = now();

