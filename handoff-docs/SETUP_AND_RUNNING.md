# Setup And Running

This guide assumes you are starting from the Capstone2 repo root.

## Prerequisites

- Node.js compatible with the frontend package. The old root README mentions Node `23.5.0`; if the team uses `fnm`, run `fnm use` from the repo root.
- npm for the Next.js app.
- Python managed through `uv`.
- PostgreSQL access, either hosted through a connection string or local on port `5432`.
- `psql` available in your terminal if you are applying schema or seed SQL from the command line.

## Environment Files

Frontend:

```bash
cd riscv
cp .env.example .env
```

Set one of these in `riscv/.env`:

```text
HOSTED_DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
# or
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
```

Backend:

Create `prototype_interp/.env` if the backend needs DB access. The backend accepts the same hosted URL variables:

```text
HOSTED_DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
# or
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
```

If no URL is set, the backend falls back to:

```text
DB_HOST=localhost
DB_NAME=capstone
DB_USER=capstone
DB_PASSWORD=capstone
DB_PORT=5432
```

Do not commit real `.env` files.

## Database Setup

For a fresh local database, create a DB/user first. Example:

```bash
psql -U postgres -d postgres
```

Then create whatever database/user your `.env` points to. The old local convention is database `capstone`, user `capstone`, password `capstone`.

Apply schema from the repo root:

```bash
psql -U capstone -d capstone -f SQL_SETUP/setupDB_Master.sql
```

For hosted DBs, use the connection string instead:

```bash
psql "postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require" -f SQL_SETUP/setupDB_Master.sql
```

Seed the newer lab set only after the schema exists:

```bash
psql "postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require" -f db-seeds/seed_lab0_intro_addition.sql
psql "postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require" -f db-seeds/seed_lab1_intro_subtraction.sql
psql "postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require" -f db-seeds/seed_lab2_intro_bitwise_and.sql
```

After seeding, assign labs to courses from the instructor UI or insert rows into `public.course_labs`.

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

The Flask backend runs on `http://localhost:25565`.

The frontend proxy routes use `BACKEND_URL` when it is set, otherwise they default to `http://localhost:25565`. For hosted frontend deployments, deploy the Flask backend separately and set `BACKEND_URL` in the frontend host environment to that backend's public URL.

Terminal 2, frontend:

```bash
cd riscv
npm run dev
```

The Next.js frontend usually runs on `http://localhost:3000`.

## Useful Checks

Frontend:

```bash
cd riscv
npm run build
npm run lint
```

Backend:

```bash
cd prototype_interp
uv run python -m pytest
```

Note: if `npm run lint` reports errors from `.next-dev`, clean generated output first:

```bash
cd riscv
npm run clean:next:dev
npm run lint
```
