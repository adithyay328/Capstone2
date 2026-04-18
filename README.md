# AssemblerLab Local Handoff

AssemblerLab is a local RISC-V assembly learning app with a Next.js frontend, a Flask emulator/grading backend, and PostgreSQL persistence. This repository is prepared for local development first: restore the local database, run the backend on `http://localhost:25565`, and run the frontend on `http://localhost:3000`.

For optional deployment notes, see `hosting-guide/README.md`. For source layout and deeper handoff notes, start with `handoff-docs/README.md`.

## Prerequisites

- Node.js compatible with the frontend package. The previous team used Node `23.5.0`.
- npm.
- Python dependencies managed by `uv`.
- PostgreSQL running locally on port `5432`.
- `psql` available in your terminal.

## 1. Create Or Reset The Local Database

From the repo root:

```bash
psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS capstone;"
psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "DROP ROLE IF EXISTS capstone;"
psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "CREATE ROLE capstone WITH LOGIN PASSWORD 'capstone';"
psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE capstone OWNER capstone;"
```

Restore the local handoff dump:

```bash
psql -U capstone -d capstone -v ON_ERROR_STOP=1 -f db-seeds/local_handoff_dump.sql
```

Important: `db-seeds/local_handoff_dump.sql` is intended to be replaced with the final handoff dump from the project database. Keep this repo private if that dump contains real users, password hashes, sessions, submissions, or secrets.

## 2. Fallback Database Setup

If the handoff dump is missing or stale, rebuild schema and minimal lab seeds instead:

```bash
psql -U capstone -d capstone -v ON_ERROR_STOP=1 -f SQL_SETUP/setupDB_Master.sql
psql -U capstone -d capstone -v ON_ERROR_STOP=1 -f db-seeds/seed_lab0_intro_addition.sql
psql -U capstone -d capstone -v ON_ERROR_STOP=1 -f db-seeds/seed_lab1_intro_subtraction.sql
psql -U capstone -d capstone -v ON_ERROR_STOP=1 -f db-seeds/seed_lab2_intro_bitwise_and.sql
```

After the fallback seed flow, assign labs to courses from the instructor UI or insert rows into `public.course_labs`.

## 3. Configure Local Env Files

Frontend:

```bash
cp riscv/.env.example riscv/.env
```

Backend:

```bash
cp prototype_interp/.env.example prototype_interp/.env
```

Both examples point at the local `capstone` database. The frontend also points simulator/grading calls at the local Flask backend.

## 4. Install Dependencies

Frontend:

```bash
cd riscv
npm ci
```

Backend:

```bash
cd prototype_interp
uv sync
```

## 5. Run The App

Terminal 1, backend:

```bash
cd prototype_interp
uv run python server.py
```

Terminal 2, frontend:

```bash
cd riscv
npm run dev
```

Open `http://localhost:3000`.

## Common Local Checks

Frontend:

```bash
cd riscv
npm run lint
npm run build
```

Backend:

```bash
cd prototype_interp
uv run python -m pytest
```

If Next.js reports missing files under `.next`, stop `npm run dev`, clean generated output, and restart:

```bash
cd riscv
npm run clean:next:dev
npm run dev
```
