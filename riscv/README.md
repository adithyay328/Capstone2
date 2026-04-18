# RISC-V Frontend

This is the Next.js frontend for AssemblerLab. For full local setup, use the repository root `README.md`.

## Local Commands

```bash
cp .env.example .env
npm ci
npm run dev
```

Open `http://localhost:3000`.

Expected local env:

```text
DATABASE_URL=postgresql://capstone:capstone@localhost:5432/capstone?sslmode=disable
BACKEND_URL=http://localhost:25565
```

Useful checks:

```bash
npm run lint
npm run build
```

If generated Next output gets stale:

```bash
npm run clean:next:dev
npm run dev
```
