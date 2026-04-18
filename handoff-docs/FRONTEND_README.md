# Frontend Readme

The frontend lives in `riscv/`. It is a Next.js App Router project with server API routes that talk to PostgreSQL and proxy simulator/grading calls to the Flask backend.

## Local Setup

Create the env file:

```bash
cp riscv/.env.example riscv/.env
```

Expected local values:

```text
DATABASE_URL=postgresql://capstone:capstone@localhost:5432/capstone?sslmode=disable
BACKEND_URL=http://localhost:25565
```

Install dependencies:

```bash
cd riscv
npm ci
```

Run locally:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Important Areas

- `app/`: App Router pages and layouts.
- `app/api/`: server API routes for auth, course/lab management, workspace persistence, settings, grading proxies, and reports.
- `app/sql/sql.tsx`: PostgreSQL pool setup.
- `app/verify/`: session verification and cookie helpers.
- `components/root.tsx`: general project workspace.
- `components/lab_root.tsx`: student lab workspace.
- `components/staff-simulator.tsx`: instructor/TA simulator.
- `components/use-runner.ts`: run/start/step orchestration.

## Simulator Proxy Flow

The browser calls Next API routes such as `/api/run`. Those routes call the local Flask backend using `BACKEND_URL`:

- `/api/run` -> `POST /data`
- `/api/score` -> `POST /score`
- `/api/grade_lab` -> `POST /grade_lab`
- `/api/grade_status` -> `POST /grade_status`

If simulator or grading calls fail locally, confirm the Flask backend is running on `http://localhost:25565` and that `riscv/.env` has `BACKEND_URL=http://localhost:25565`.

## Checks

```bash
cd riscv
npm run lint
npm run build
```

If generated Next output gets stale, stop `npm run dev`, run `npm run clean:next:dev`, and restart.
