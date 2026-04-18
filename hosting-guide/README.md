# Optional Hosting Guide

The normal handoff path is local development. Use this guide only if you want to deploy the app again.

## Services

- Frontend: Vercel running the `riscv/` Next.js app.
- Database: Neon PostgreSQL.
- Backend: any Python web host that can run the Flask service in `prototype_interp/` and expose a public HTTPS URL.

## Deployment Order

1. Create a Neon project and database.
2. Apply schema and seed data to Neon.
3. Deploy the Flask backend with the Neon database URL.
4. Deploy the Vercel frontend with the Neon database URL and public Flask backend URL.
5. Verify login, course pages, and `/api/run` from the hosted frontend.

## Neon Setup

Use `psql` against the Neon connection string:

```bash
psql "postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require" -v ON_ERROR_STOP=1 -f SQL_SETUP/setupDB_Master.sql
psql "postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require" -v ON_ERROR_STOP=1 -f db-seeds/seed_lab0_intro_addition.sql
psql "postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require" -v ON_ERROR_STOP=1 -f db-seeds/seed_lab1_intro_subtraction.sql
psql "postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require" -v ON_ERROR_STOP=1 -f db-seeds/seed_lab2_intro_bitwise_and.sql
```

If you have a vetted SQL dump, restore that instead of the fallback seed files.

## Flask Backend Hosting

The backend entrypoint is `prototype_interp/server.py`. The server uses the provider's `PORT` env var when present and binds to `0.0.0.0`.

Required backend env:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
```

The backend must be reachable from the public internet over HTTPS. Its base URL becomes the frontend `BACKEND_URL`.

## Vercel Frontend Hosting

Configure Vercel to use the `riscv/` directory as the project root.

Required frontend env:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST/DBNAME?sslmode=require
BACKEND_URL=https://YOUR_PUBLIC_FLASK_BACKEND_URL
```

Use the backend base URL only. Do not include `/data`, `/score`, `/grade_lab`, or `/grade_status`; the Next API routes append those paths.

## Hosted Smoke Test

- Login as a student and instructor.
- Open a course/lab page.
- Run code in the simulator and confirm the hosted frontend reaches the hosted Flask backend.
- Check hosted logs if `/api/run`, `/api/score`, `/api/grade_lab`, or `/api/grade_status` fail.
