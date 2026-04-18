# Setup And Running

This guide assumes you are starting from the Capstone2 repo root. The root `README.md` is the shortest setup path; this file gives the same local flow with extra checks.

## Prerequisites

- Node.js compatible with the frontend package. The previous team used Node `23.5.0`.
- npm.
- Python managed through `uv`.
- PostgreSQL running locally on port `5432`.
- `psql` available in your terminal.

## Local Environment Files

Frontend:

```bash
cp riscv/.env.example riscv/.env
```

Backend:

```bash
cp prototype_interp/.env.example prototype_interp/.env
```

Expected local values:

```text
DATABASE_URL=postgresql://capstone:capstone@localhost:5432/capstone?sslmode=disable
BACKEND_URL=http://localhost:25565
```

`BACKEND_URL` is only needed by the frontend. Do not commit real `.env` files.

## Database Setup

Create/reset the local database:

```bash
psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS capstone;"
psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "DROP ROLE IF EXISTS capstone;"
psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "CREATE ROLE capstone WITH LOGIN PASSWORD 'capstone';"
psql -U postgres -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE capstone OWNER capstone;"
```

Restore the handoff dump:

```bash
psql -U capstone -d capstone -v ON_ERROR_STOP=1 -f db-seeds/local_handoff_dump.sql
```

If the dump file is still a placeholder or does not match the current app, use the fallback schema and lab seeds:

```bash
psql -U capstone -d capstone -v ON_ERROR_STOP=1 -f SQL_SETUP/setupDB_Master.sql
psql -U capstone -d capstone -v ON_ERROR_STOP=1 -f db-seeds/seed_lab0_intro_addition.sql
psql -U capstone -d capstone -v ON_ERROR_STOP=1 -f db-seeds/seed_lab1_intro_subtraction.sql
psql -U capstone -d capstone -v ON_ERROR_STOP=1 -f db-seeds/seed_lab2_intro_bitwise_and.sql
```

After fallback seeding, assign labs to courses from the instructor UI or insert rows into `public.course_labs`.

## Install Dependencies

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

## Run Locally

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

## Useful Checks

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
