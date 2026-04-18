db-seeds
========

Primary handoff seed:
  - local_handoff_dump.sql — replace the placeholder with the final local SQL dump before handoff.

Create final dump:
  pg_dump --clean --if-exists --no-owner --no-privileges "$DATABASE_URL" > db-seeds/local_handoff_dump.sql

Restore primary seed:
  psql -U capstone -d capstone -v ON_ERROR_STOP=1 -f db-seeds/local_handoff_dump.sql

Fallback lab seeds:
  - seed_lab0_intro_addition.sql
  - seed_lab1_intro_subtraction.sql
  - seed_lab2_intro_bitwise_and.sql

Use fallback lab seeds only after schema setup with SQL_SETUP/setupDB_Master.sql.
After fallback seeding, assign labs to courses in the instructor UI or by inserting into public.course_labs.

Security note:
  Keep this repository private if local_handoff_dump.sql contains real users, password hashes, sessions, submissions, or secrets.
