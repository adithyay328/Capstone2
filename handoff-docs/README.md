# Capstone2 Handoff Docs

This folder is the onboarding bundle for the AssemblerLab RISC-V learning app. Start with the root `README.md` for the local setup checklist, then use these docs for subsystem details.

## What This Repo Contains

- `riscv/`: Next.js frontend, student/instructor/TA pages, API routes, auth/session code, and database access used by the web app.
- `prototype_interp/`: Python Flask backend and RISC-V emulator used by simulator and grading endpoints.
- `SQL_SETUP/`: schema setup scripts. `setupDB_Master.sql` is the fallback schema entrypoint.
- `db-seeds/`: local handoff dump placeholder plus smaller fallback lab seed files.
- `archive/legacy/`: old setup files kept for history only. Do not use these for normal setup.

Generated folders such as `riscv/.next`, `riscv/.next-dev`, `riscv/node_modules`, `prototype_interp/.venv`, and `prototype_interp/__pycache__` are not source folders.

## Start Here

1. Follow the root `README.md` to restore the local database and run both services.
2. Read `REPO_MAP.md` for the folder map.
3. Read `DATABASE_AND_SQL.md` before touching schema or seed data.
4. Use `FRONTEND_README.md` when working in `riscv/`.
5. Use `BACKEND_README.md` when working in `prototype_interp/`.
6. Use `TROUBLESHOOTING.md` when local setup fails.

## Local Architecture

- PostgreSQL runs locally on port `5432` with database/user/password `capstone`.
- The Flask backend runs locally on `http://localhost:25565`.
- The Next.js frontend runs locally on `http://localhost:3000`.
- Next API routes proxy simulator/grading calls to Flask and query PostgreSQL directly for app data.

## Important Rules

- Do not commit real `.env` files.
- Keep the repo private if `db-seeds/local_handoff_dump.sql` contains real users, password hashes, sessions, submissions, or secrets.
- Prefer the local handoff dump for newcomer setup.
- Use `SQL_SETUP/setupDB_Master.sql` only as the fallback schema rebuild path.
- Ignore files under `archive/legacy/` for normal setup.
