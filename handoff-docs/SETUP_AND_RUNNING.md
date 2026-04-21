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

Set this in `riscv/.env`:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
```

Backend:

Create `prototype_interp/.env` if the backend needs DB access. Use the same database URL there:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
```

If `DATABASE_URL` is not set, the backend falls back to:

```text
DB_HOST=localhost
DB_NAME=capstone
DB_USER=capstone
DB_PASSWORD=capstone
DB_PORT=5432
```

Do not commit real `.env` files.

## Database Setup

Follow the instructions here:

Capstone2/handoff-docs/Database_Setup_instructions.md


## Install Dependencies

General:

Install fnm:
1. brew install fnm
2. Choose one of the following:
Windows: 
notepad $PROFILE
fnm env --use-on-cd | Out-String | Invoke-Expression

Mac:
echo 'eval "$(fnm env --use-on-cd)"' >> ~/.zshrc
source ~/.zshrc

Linux
echo 'eval "$(fnm env --use-on-cd)"' >> ~/.bashrc
source ~/.bashrc

3. cd riscv
4. fnm install 23.5.0
5. fnm use 23.5.0
6. echo “23.5.0” > .nvmrc (SKIP STEP 6 IF THIS FILE IS ALREADY IN REPO)

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
