# Sponsor demo setup – Admin dashboard

Quick steps to practice course and user management in front of sponsors.

## Default logins (if already in DB)

- **Student:** username `student`, password `student`
- **Instructor / teacher:** username `teacher`, password `teacher`

If these users don’t exist yet, create them from the Instructor dashboard (see below).

## 1. Log in as instructor

1. Go to the login page.
2. Use **teacher** / **teacher** (or another instructor account).

## 2. Create sample users (optional)

From the **Instructor Admin Dashboard**:

- **User Management** → **Create New User**
- Create a **student**: username `student`, password `student`, leave **Instructor** unchecked.
- Create an **instructor**: username `teacher`, password `teacher`, check **Instructor** (if not already present).

You can also create extra users (e.g. `ta1` / `ta1`) for TAs.

## 3. Course controls (practice flow)

From the same dashboard, **Course Controls**:

1. **Create New Course**  
   - Course ID: 5 digits (e.g. `10101`).  
   - Code (e.g. `CS101`), Title, optional Term.  
   - You are added as instructor for that course.

2. **View/Edit Courses**  
   - List all courses, edit code/title/term, or open **Roster** for a course.

3. **Add Student to Course**  
   - Select course → choose role: **Student**, **TA**, or **Instructor**.  
   - Search by username → **Add**.  
   - Use this to add students and to add TAs or fellow instructors to a course.

4. **Drop Student from Course**  
   - Select course → see roster → **Drop** next to a user to remove them from that course.

## 4. Manage roles in a course

- **Admin Controls** → **Manage Roles** (or **Add Student to Course**)  
- Same “Add to course” flow: pick course, pick user, set role to **Student**, **TA**, or **Instructor**, then Add.  
- To remove someone from a course, use **Drop Student from Course** or the course **Roster** from View/Edit Courses.

## Database

Follow the root `README.md` local database setup first. The preferred path is
restoring `db-seeds/local_handoff_dump.sql` into a blank local `capstone`
database.

If that dump is not available, use the fallback schema path:

- `psql -U capstone -d capstone -v ON_ERROR_STOP=1 -f SQL_SETUP/setupDB_Master.sql`
- `psql -U capstone -d capstone -v ON_ERROR_STOP=1 -f db-seeds/seed_lab0_intro_addition.sql`
- `psql -U capstone -d capstone -v ON_ERROR_STOP=1 -f db-seeds/seed_lab1_intro_subtraction.sql`
- `psql -U capstone -d capstone -v ON_ERROR_STOP=1 -f db-seeds/seed_lab2_intro_bitwise_and.sql`

Then use the app to create the sample users above so logins work for the demo.
