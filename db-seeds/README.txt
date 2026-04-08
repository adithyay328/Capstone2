db-seeds — run on your hosted PostgreSQL
========================================

Use these SQL files against the SAME database your Next.js app uses (see env / connection string).

Prerequisites:
  - Schema already created (tables public.labs and public.test_cases, etc.).

What to run:
  - seed_lab0_intro_addition.sql — Lab 0 (addition) + five test cases.
  - seed_lab1_intro_subtraction.sql — Lab 1 (subtraction) + five test cases.
  - seed_lab2_intro_bitwise_and.sql — Lab 2 (bitwise AND) + five test cases.

After seeding:
  - Assign each lab to a course in the instructor UI (course page → assign lab), OR insert into public.course_labs.

Lab UIDs: lab0-intro-addition, lab1-intro-subtraction, lab2-intro-bitwise-and

You can ignore older copies under SQL_SETUP/ if you standardize on this folder for production seeds.
