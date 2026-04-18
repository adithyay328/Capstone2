# RISC-V Backend

This is the Flask backend and RISC-V emulator for AssemblerLab. For full local setup, use the repository root `README.md`.

## Local Commands

```bash
cp .env.example .env
uv sync
uv run python server.py
```

The backend listens on `http://localhost:25565`.

Expected local env:

```text
DATABASE_URL=postgresql://capstone:capstone@localhost:5432/capstone?sslmode=disable
```

Run tests:

```bash
uv run python -m pytest
```
