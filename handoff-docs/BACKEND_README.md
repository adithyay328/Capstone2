# Backend Readme

The backend lives in `prototype_interp/`. It is a Flask app plus a RISC-V emulator.

## Local Setup

Create the backend env file from the local example:

```bash
cp prototype_interp/.env.example prototype_interp/.env
```

Expected local value:

```text
DATABASE_URL=postgresql://capstone:capstone@localhost:5432/capstone?sslmode=disable
```

Install dependencies:

```bash
cd prototype_interp
uv sync
```

Run locally:

```bash
uv run python server.py
```

The backend listens on `http://localhost:25565`.

## Flask Endpoints

- `POST /data`: run simulator code. Input includes `code`, optional `registers`, and optional `memory`. Output includes `hadError`, `errorMessage`, and `states`.
- `POST /score`: grade one test case by test UID.
- `POST /grade_lab`: grade all test cases for a lab in a course, enforce attempt limits, and save submission history when a grade session ID is present.
- `POST /grade_status`: return attempts used/remaining for a user, course, and lab.

Frontend API routes proxy simulator/grading calls to these Flask endpoints.

## Database Access

`server.py` loads `prototype_interp/.env` if present. The local handoff path uses `DATABASE_URL`.

If `DATABASE_URL` is absent, the backend can fall back to individual DB fields:

```text
DB_HOST=localhost
DB_NAME=capstone
DB_USER=capstone
DB_PASSWORD=capstone
DB_PORT=5432
```

Prefer `DATABASE_URL` for handoff because it matches the frontend env file.

## Tests

```bash
cd prototype_interp
uv run python -m pytest
```

Keep frontend/backend JSON shapes aligned with `riscv/components/types.ts`.
