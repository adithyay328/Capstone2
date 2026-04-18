# Troubleshooting

## Local Database Connection Fails

Symptoms:

- Login/register/API calls fail.
- Error mentions missing or invalid `DATABASE_URL`.

Check:

- Local PostgreSQL is running.
- `riscv/.env` exists and contains `DATABASE_URL=postgresql://capstone:capstone@localhost:5432/capstone?sslmode=disable`.
- `prototype_interp/.env` has the same `DATABASE_URL`.
- The local `capstone` database has been restored from `db-seeds/local_handoff_dump.sql` or rebuilt with the fallback schema flow.

## Handoff Dump Placeholder Fails

Symptoms:

- `psql -f db-seeds/local_handoff_dump.sql` prints that the file is a placeholder.

Fix:

- Replace `db-seeds/local_handoff_dump.sql` with the final handoff dump, or use the fallback schema flow:

```bash
psql -U capstone -d capstone -v ON_ERROR_STOP=1 -f SQL_SETUP/setupDB_Master.sql
psql -U capstone -d capstone -v ON_ERROR_STOP=1 -f db-seeds/seed_lab0_intro_addition.sql
psql -U capstone -d capstone -v ON_ERROR_STOP=1 -f db-seeds/seed_lab1_intro_subtraction.sql
psql -U capstone -d capstone -v ON_ERROR_STOP=1 -f db-seeds/seed_lab2_intro_bitwise_and.sql
```

## Simulator Run Fails

Symptoms:

- Running code from the editor returns backend connection errors.
- `/api/run`, `/api/score`, `/api/grade_lab`, or `/api/grade_status` fails.

Check that the backend is running:

```bash
cd prototype_interp
uv run python server.py
```

The backend should listen on `http://localhost:25565`. The frontend env should include:

```text
BACKEND_URL=http://localhost:25565
```

## Backend Cannot Connect To Database

Symptoms:

- `/score`, `/grade_lab`, or `/grade_status` fail.
- Error mentions missing `DATABASE_URL`, `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, or `DB_PORT`.

Fix:

```bash
cp prototype_interp/.env.example prototype_interp/.env
```

Then restart the backend.

## Stale Next.js Build Output

Symptoms:

- Errors mention missing files under `riscv/.next`, such as `routes-manifest.json`, `_document.js`, or generated page chunks.

Fix:

```bash
cd riscv
npm run clean:next:dev
npm run dev
```

Stop any already-running `npm run dev` process before cleaning.

## Port Conflicts

Expected local ports:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:25565`
- PostgreSQL: `5432`

If a port is already in use, stop the conflicting process before starting the app.

## Tests

Backend tests:

```bash
cd prototype_interp
uv run python -m pytest
```

Frontend checks:

```bash
cd riscv
npm run lint
npm run build
```
