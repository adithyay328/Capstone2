# Repo Map

This map focuses on source files and handoff-relevant folders. It intentionally skips generated and dependency folders.

## Root

- `README.md`: primary local setup and running guide.
- `handoff-docs/`: onboarding documentation bundle.
- `hosting-guide/`: optional deployment notes, not needed for local handoff.
- `archive/legacy/`: old setup files preserved for history only.
- `package.json`: root package metadata; the active frontend package is in `riscv/`.
- `gitinfo.md`: branch workflow note.

## `riscv/`

Next.js frontend.

- `app/`: App Router pages, layouts, and server API routes.
- `app/api/`: API route handlers for auth, labs, courses, grading proxies, workspace/session sync, settings, and reports.
- `app/sql/sql.tsx`: PostgreSQL connection pool for frontend/server routes.
- `app/verify/`: session verification and auth helpers.
- `components/`: shared React components and simulator UI.
- `components/root.tsx`: general project workspace.
- `components/lab_root.tsx`: student lab workspace.
- `components/staff-simulator.tsx`: instructor/TA sandbox.
- `components/use-runner.ts`: frontend run/start/step orchestration.
- `components/types.ts`: frontend/backend simulator request/response types.
- `public/`: static assets.
- `.env.example`: local frontend env template.
- `package.json`: frontend scripts and dependencies.

Generated/dependency folders to ignore: `.next`, `.next-dev`, `node_modules`.

## `prototype_interp/`

Python Flask backend and emulator.

- `server.py`: Flask app, routes, DB connection, scoring/grading logic.
- `stringParse.py`: parser and lab-source preprocessing.
- `instructions.py`: RISC-V instruction implementations.
- `machine.py`: register/memory/PC state.
- `runtime.py`: execution loop.
- `test_*.py`: backend pytest files.
- `.env.example`: local backend env template.
- `pyproject.toml`: backend dependencies and Python requirement.
- `uv.lock`: locked backend dependency graph.

Generated/dependency folders to ignore: `.venv`, `__pycache__`, `.pytest_cache`.

## `SQL_SETUP/`

Fallback schema setup and migration-style SQL.

- `setupDB_Master.sql`: fallback schema setup entrypoint.
- `setupDB_Init.sql`: original core schema and older starter data.
- `setupDB_Persistence.sql`: workspace and lab session persistence.
- `setupDB_UserSettings.sql`: user settings table.
- `setupDB_Courses.sql`: courses, memberships, course labs, and older lab grades.
- `setupDB_GradeAttempts.sql`: older lab attempt tracking.
- `setupDB_CourseGradeAttempts.sql`: course-aware attempts and submission history.
- `setupDB_ASUID.sql`: ASU ID/user migration.
- `setupDB_TARoles.sql`: TA profile, course sections, and section enrollment helpers.
- `setupDB_RISCV_LoadStore_Syntax.sql`: seeded lab syntax patch.

Normal newcomer setup should restore `db-seeds/local_handoff_dump.sql` first. Use `setupDB_Master.sql` only if the dump is missing or stale.

## `db-seeds/`

Local database seed inputs.

- `local_handoff_dump.sql`: primary local handoff seed placeholder; replace with the final dump before handoff.
- `seed_lab0_intro_addition.sql`
- `seed_lab1_intro_subtraction.sql`
- `seed_lab2_intro_bitwise_and.sql`

Run the three lab seeds only after fallback schema setup.
