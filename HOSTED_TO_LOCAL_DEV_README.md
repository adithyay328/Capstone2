# Switch From Hosted Config To Local Dev

This repo has two services:

- `riscv/`: Next.js frontend plus Next API routes.
- `prototype_interp/`: Flask backend for simulator and grading.

The hosted deployment needs public URLs. Local dev should usually use:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:25565
```

## 1. Back Up The Hosted Env Files

Do this before changing local `.env` files:

```bash
cp riscv/.env riscv/.env.hosted.backup
cp prototype_interp/.env prototype_interp/.env.hosted.backup
```

Do not commit these files. They can contain real database credentials.

## 2. Pick A Local Dev Mode

Use one of these modes. The frontend and backend should point at the same database.

### Mode A: Local Frontend And Backend, Hosted Database

Use this when you want to run the app locally but keep using the hosted database.

`riscv/.env`:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
BACKEND_URL=http://localhost:25565
```

`prototype_interp/.env`:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
```

Use the same `DATABASE_URL` in both env files so the frontend and backend point at the same database.

### Mode B: Fully Local Frontend, Backend, And Database

Use this when you want everything on your machine.

Create the local database and role:

```bash
psql -U postgres -d postgres -v ON_ERROR_STOP=1 <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'capstone') THEN
    CREATE ROLE capstone WITH LOGIN PASSWORD 'capstone';
  END IF;
END $$;

DROP DATABASE IF EXISTS capstone;
CREATE DATABASE capstone OWNER capstone;
SQL

psql -U postgres -d capstone -v ON_ERROR_STOP=1 <<'SQL'
ALTER SCHEMA public OWNER TO capstone;
GRANT ALL ON SCHEMA public TO capstone;
SQL
```

Apply schema and seeds from the repo root:

```bash
psql -U capstone -d capstone -f SQL_SETUP/setupDB_Master.sql
psql -U capstone -d capstone -f db-seeds/seed_lab0_intro_addition.sql
psql -U capstone -d capstone -f db-seeds/seed_lab1_intro_subtraction.sql
psql -U capstone -d capstone -f db-seeds/seed_lab2_intro_bitwise_and.sql
```

`riscv/.env`:

```text
DATABASE_URL=postgresql://capstone:capstone@localhost:5432/capstone?sslmode=disable
BACKEND_URL=http://localhost:25565
```

`prototype_interp/.env`:

```text
DATABASE_URL=postgresql://capstone:capstone@localhost:5432/capstone?sslmode=disable
```

For fully local DB mode, make sure both env files use the local `DATABASE_URL` shown above.

## 3. Install Dependencies

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

## 4. Run Local Dev

Terminal 1:

```bash
cd prototype_interp
uv run python server.py
```

Expected backend URL:

```text
http://localhost:25565
```

Terminal 2:

```bash
cd riscv
npm run dev
```

Expected frontend URL:

```text
http://localhost:3000
```

Restart `npm run dev` after changing `riscv/.env`. Next.js does not reliably reload server-side env changes while the dev server is already running.

## 5. Verify The Switch

Check that `riscv/.env` has:

```text
BACKEND_URL=http://localhost:25565
```

Then open:

```text
http://localhost:3000
```

Run code in the simulator. If it says it cannot connect to the backend:

- Confirm the Flask backend terminal is still running.
- Confirm `BACKEND_URL` is the base URL only, not `http://localhost:25565/data`.
- Confirm you restarted `npm run dev` after editing `riscv/.env`.
- Confirm the frontend and backend env files point at the same database.

## Switch Back To Hosted Config

Restore the backup env files:

```bash
cp riscv/.env.hosted.backup riscv/.env
cp prototype_interp/.env.hosted.backup prototype_interp/.env
```

For deployed hosting dashboards, set:

```text
BACKEND_URL=https://YOUR_PUBLIC_FLASK_BACKEND_URL
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
```

Redeploy the frontend after changing hosted environment variables.
