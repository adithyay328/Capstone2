# Sponsor Demo Script – Feature by Feature

Use these exact example values so you can run the demo in order. Log in as **teacher** / **teacher** first and keep this page open.

---

## Feature 1: Create a New Course

**What you’re showing:** An instructor creates a course; they are added as instructor for that course.

1. From the **Instructor Admin Dashboard**, under **Course Controls**, click **Create New Course**.
2. Fill the form:
   - **Course ID (5 digits):** `10101`
   - **Code:** `CS101`
   - **Title:** `Introduction to RISC-V`
   - **Term (optional):** `Spring 2026`
3. Click **Create Course**.
4. You should see a success message. You now have one course: CS101.

---

## Feature 2: View / Edit Courses

**What you’re showing:** List all courses and edit their details.

1. From the dashboard, click **View/Edit Courses**.
2. You should see **CS101 — Introduction to RISC-V** (and any other courses).
3. Click **Edit** on that course.
4. Change:
   - **Code:** `CS101` → `EE 101` (or leave as is)
   - **Title:** e.g. `RISC-V Lab Course`
   - **Term:** e.g. `Spring 2026`
5. Click **Save**.
6. Confirm the row shows the updated title/code. Click **Cancel** if you don’t want to keep the change, or **Edit** again to fix.

---

## Feature 3: Add a Student to a Course

**What you’re showing:** Add a user to a course with the role “Student.”

1. From the dashboard, click **Add Student to Course**.
2. **Course:** Select **CS101 — Introduction to RISC-V** (or the course you created).
3. **Role to assign:** Leave **Student**.
4. In the search box type: `student` and click **Search**.
5. In the results, find **student** and click **Add**.
6. You should see a success message. That user is now a student in CS101.

*(If “student” doesn’t exist yet, go to **User Management → Create New User** and create username `student`, password `student`, **Instructor** unchecked; then return here.)*

---

## Feature 4: Add a TA or Fellow Instructor to a Course

**What you’re showing:** Same “Add to course” flow, but with role TA or Instructor.

1. Stay on **Add Student to Course** (or open it from the dashboard).
2. **Course:** Select **CS101 — Introduction to RISC-V**.
3. **Role to assign:** Choose **TA** (or **Instructor** if you want to add another instructor).
4. Search for a user (e.g. create a user first: username `ta1`, password `ta1`, check **Instructor**; then search `ta1`).
5. Click **Add** next to that user.
6. They are now in the course as TA (or Instructor). You can confirm in **View/Edit Courses → Roster** for that course.

---

## Feature 5: View Course Roster (and confirm Add worked)

**What you’re showing:** See who is in a course and their roles.

1. Click **View/Edit Courses**.
2. Find **CS101** and click **Roster**.
3. You should see:
   - **student** — role **student**
   - **ta1** (or whoever you added) — role **ta** or **instructor**
   - **teacher** — role **instructor** (you, from when the course was created)
4. From here you can also click **Add user to this course** to add more people.

---

## Feature 6: Drop a Student (or any member) from a Course

**What you’re showing:** Remove a user from a course roster.

**Option A – From “Drop Student from Course”**

1. From the dashboard, click **Drop Student from Course**.
2. **Course:** Select **CS101 — Introduction to RISC-V**.
3. The roster appears. Find **student** (or any member you want to remove).
4. Click **Drop** next to that username.
5. Confirm a success message; that user is no longer in the course.

**Option B – From Roster**

1. Go to **View/Edit Courses** → **Roster** for **CS101**.
2. Click **Drop** next to the user you want to remove.
3. Same result: they are removed from the course.

*(You can add them back with **Add Student to Course** for the next demo run.)*

---

## Feature 7: Create New User (sample users for demo)

**What you’re showing:** Instructor creates student and instructor accounts.

1. From the dashboard, **User Management** → **Create New User**.

**Create a student**

- **Username:** `student`
- **Password:** `student`
- **Instructor:** leave **unchecked**
- Click **Submit**. You should see “User created successfully.”

**Create an instructor / TA account**

- **Username:** `ta1`
- **Password:** `ta1`
- **Instructor:** **check** the box
- Click **Submit**.

You can then use **student** and **ta1** in Features 3 and 4 (Add to course, Drop, etc.).

---

## Feature 8: Manage Roles (same as Add to Course)

**What you’re showing:** Assign different roles (Student / TA / Instructor) per course.

1. From the dashboard, **Admin Controls** → **Manage Roles** (or use **Add Student to Course**).
2. **Course:** e.g. **CS101**.
3. **Role to assign:** e.g. **TA**.
4. **Search** for `ta1` (or any user), then click **Add**.
5. That user is now in the course with the chosen role. Show the **Roster** (Feature 5) to confirm the role.

---

## Quick reference – example values

| Item        | Example value(s)                          |
|------------|-------------------------------------------|
| Course ID  | `10101`                                   |
| Course code| `CS101`                                   |
| Course title | `Introduction to RISC-V`                |
| Term       | `Spring 2026`                             |
| Student    | username: `student`, password: `student`   |
| Instructor | username: `teacher`, password: `teacher`   |
| TA         | username: `ta1`, password: `ta1` (create as Instructor, then add to course as TA) |

---

## Suggested demo order (5–10 minutes)

1. **Create New Course** (10101, CS101, Introduction to RISC-V, Spring 2026).
2. **View/Edit Courses** – show list, edit title, save.
3. **Create New User** – create `student` and `ta1` if needed.
4. **Add Student to Course** – add `student` to CS101 as Student.
5. **Add TA/Instructor** – add `ta1` to CS101 as TA (or Instructor).
6. **View Roster** – show CS101 roster with roles.
7. **Drop Student** – drop `student` from CS101; show roster again.
8. **Manage Roles** – add `student` back as Student to show role assignment.

This order builds one course and one roster so sponsors see the full flow without switching context.
