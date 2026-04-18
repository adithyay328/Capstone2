# Database And SQL

The database is PostgreSQL. For handoff, the default path is restoring the local dump into a local `capstone` database. Schema scripts remain available as a fallback and for future migrations.

## Main Files

- `db-seeds/local_handoff_dump.sql`: primary local handoff seed. Replace the placeholder with the final SQL dump before handoff.
- `SQL_SETUP/setupDB_Master.sql`: fallback schema setup entrypoint.
- `SQL_SETUP/setupDB_*.sql`: individual idempotent setup/migration scripts used by the master file.
- `db-seeds/seed_lab0_intro_addition.sql`, `seed_lab1_intro_subtraction.sql`, `seed_lab2_intro_bitwise_and.sql`: fallback lab seeds.
- `archive/legacy/`: old flattened or duplicate SQL kept for history only.

## Creating The Final Dump

Before handoff, export the current project database into the placeholder file:

```bash
pg_dump --clean --if-exists --no-owner --no-privileges "$DATABASE_URL" > db-seeds/local_handoff_dump.sql
```

Review the dump before committing it. Keep the repo private if the dump includes real users, password hashes, sessions, submissions, or secrets. If the dump should not include real data, create sanitized users/submissions first or use the fallback schema flow below.

## Primary Restore Flow

```bash
psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS capstone;"
psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "DROP ROLE IF EXISTS capstone;"
psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "CREATE ROLE capstone WITH LOGIN PASSWORD 'capstone';"
psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE capstone OWNER capstone;"
psql -U capstone -d capstone -v ON_ERROR_STOP=1 -f db-seeds/local_handoff_dump.sql
```

Keep the repo private if the dump includes real users, password hashes, sessions, submissions, or secrets.

## Fallback Schema Flow

Use this only if the handoff dump is unavailable or stale:

```bash
psql -U capstone -d capstone -v ON_ERROR_STOP=1 -f SQL_SETUP/setupDB_Master.sql
psql -U capstone -d capstone -v ON_ERROR_STOP=1 -f db-seeds/seed_lab0_intro_addition.sql
psql -U capstone -d capstone -v ON_ERROR_STOP=1 -f db-seeds/seed_lab1_intro_subtraction.sql
psql -U capstone -d capstone -v ON_ERROR_STOP=1 -f db-seeds/seed_lab2_intro_bitwise_and.sql
```

`setupDB_Master.sql` detects whether core tables exist. On a fresh DB it runs `setupDB_Init.sql`; on an existing DB it skips destructive init and applies the other setup scripts.

## Table Groups

Core:

- `users`: app users and role/profile fields.
- `secrets`: app secret storage.
- `labs`: lab definitions and Markdown instructions.
- `test_cases`: seed/result register and memory JSON for lab grading.

Workspace/session persistence:

- `workspaces`: per-user current workspace pointer.
- `workspace_projects`: saved project code and simulator state.
- `lab_sessions`: saved student lab code and simulator state.
- `user_settings`: editor/UI preferences.

Courses and membership:

- `courses`: course records.
- `course_memberships`: user membership and role in a course.
- `course_labs`: labs assigned to courses.
- `lab_grades`: older lab-grade records.

Attempts/submissions:

- `grade_attempts`, `grade_attempt_sessions`: older per-lab attempt tracking.
- `course_grade_attempts`, `course_grade_attempt_sessions`: course-aware attempt tracking.
- `course_lab_submissions`: submission history and aggregate grade records.

TA/section support:

- `ta_profiles`
- `course_sections`
- `ta_section_enrollments`
- Functions such as `assign_ta_to_section` and `unassign_ta_from_section`.

## Migration Cautions

- Keep schema changes idempotent where possible.
- If adding a table that depends on another table, add it after its parent table setup script in `setupDB_Master.sql`.
- Keep test-case JSON shapes compatible with backend grading: `seed_registers`, `seed_memory`, `result_registers`, and `result_memory` are JSON maps of string keys to hex string values.
- Do not commit real database URLs or `.env` files.
