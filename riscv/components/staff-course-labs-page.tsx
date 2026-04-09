'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { addCourseLab } from '@/app/api/add_course_lab/frontend';
import { getCourseLabs, type CourseLab } from '@/app/api/course_labs/frontend';
import { listCourses } from '@/app/api/list_courses/frontend';
import { listStaffCourses } from '@/app/api/staff_courses/frontend';
import { listLabs } from '@/app/api/list_labs/frontend';
import { removeCourseLab } from '@/app/api/remove_course_lab/frontend';
import type { Course } from '@/app/api/list_courses/types';
import type { Lab } from '@/app/api/list_labs/types';
import { ins } from '@/components/instructor-shell';

type StaffCourseLabsPageProps = {
  portal: 'instructor' | 'ta';
  canManageLabs: boolean;
};

type FlashMessage = {
  success: boolean;
  text: string;
};

type SharedViewProps = {
  backHref: string;
  canManageLabs: boolean;
  course: Course | null;
  courseId: string;
  courseLabs: CourseLab[];
  labsNotInCourse: Lab[];
  loading: boolean;
  message: FlashMessage | null;
  adding: string | null;
  removing: string | null;
  portal: 'instructor' | 'ta';
  onAdd: (labUid: string) => Promise<void>;
  onRemove: (labUid: string) => Promise<void>;
};

function isValidCourseId(courseId: string) {
  return /^[0-9]{5}$/.test(courseId);
}

function formatCourseLabel(course: Course | null, courseId: string) {
  if (course) {
    return `${course.code} — ${course.title}`;
  }

  return `Course ${courseId}`;
}

function InstructorCourseLabsView({
  backHref,
  canManageLabs,
  course,
  courseId,
  courseLabs,
  labsNotInCourse,
  loading,
  message,
  adding,
  removing,
  onAdd,
  onRemove,
}: SharedViewProps) {
  return (
    <div className={ins.pageWrapWide}>
      <Link href={backHref} className={ins.backLink}>
        ← Back to courses
      </Link>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className={ins.kicker}>Course Labs</p>
          <h1 className={`${ins.h1} mt-2`}>Manage lab assignments</h1>
          <p className={ins.subtitle}>{formatCourseLabel(course, courseId)}</p>
          {course?.term && <p className="mt-1 text-sm text-stone-600">{course.term}</p>}
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/instructor/courses/roster?course_id=${encodeURIComponent(courseId)}`}
            className={ins.btnSecondary}
          >
            Open roster
          </Link>
          <Link href="/instructor/labs" className={ins.btnNeutral}>
            Lab library
          </Link>
        </div>
      </header>

      {message && (
        <div className={message.success ? ins.msgOk : ins.msgErr}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className={`${ins.card} ${ins.cardPad} flex flex-col items-center py-12`}>
          <div className={ins.spinner} />
          <p className="mt-4 text-sm text-stone-600">Loading course labs...</p>
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-2">
            <article className={`${ins.card} ${ins.cardPad}`}>
              <p className={ins.labelCaps}>Assigned</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-stone-900">
                {courseLabs.length}
              </p>
              <p className="mt-2 text-sm text-stone-600">
                Labs currently visible to students in this course.
              </p>
            </article>

            <article className={`${ins.card} ${ins.cardPad}`}>
              <p className={ins.labelCaps}>Available to add</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-stone-900">
                {canManageLabs ? labsNotInCourse.length : 0}
              </p>
              <p className="mt-2 text-sm text-stone-600">
                Existing lab definitions that are not assigned here yet.
              </p>
            </article>
          </section>

          <section className={`${ins.card} overflow-hidden`}>
            <div className="flex flex-col gap-2 border-b border-amber-100 px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className={ins.h2Card}>Assigned labs</h2>
                <p className="mt-1 text-sm text-stone-600">
                  Review submissions or update the underlying lab definition.
                </p>
              </div>
              {canManageLabs && (
                <Link href="/instructor/labs" className={ins.linkAccent}>
                  Create or edit labs
                </Link>
              )}
            </div>

            {courseLabs.length === 0 ? (
              <div className="px-6 py-8 text-sm text-stone-600">
                No labs are assigned to this course yet. Add one from the catalog below.
              </div>
            ) : (
              <ul className={ins.divideList}>
                {courseLabs.map((lab) => (
                  <li
                    key={lab.lab_uid}
                    className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between"
                  >
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-stone-900">{lab.title}</h3>
                      <p className="mt-1 text-sm text-stone-600">{lab.lab_uid}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/instructor/courses/submissions?course_id=${encodeURIComponent(courseId)}&lab_uid=${encodeURIComponent(lab.lab_uid)}`}
                        className={ins.btnSecondary}
                      >
                        Submissions
                      </Link>
                      {canManageLabs && (
                        <Link
                          href={`/instructor/edit_lab/${lab.lab_uid}`}
                          className={ins.btnNeutral}
                        >
                          Edit lab
                        </Link>
                      )}
                      {canManageLabs && (
                        <button
                          type="button"
                          onClick={() => void onRemove(lab.lab_uid)}
                          disabled={removing === lab.lab_uid}
                          className={ins.btnDanger}
                        >
                          {removing === lab.lab_uid ? 'Removing...' : 'Remove'}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {canManageLabs && (
            <section className={`${ins.card} ${ins.cardPad}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className={ins.h2Card}>Lab catalog</h2>
                  <p className={`${ins.subtitleMuted} mt-1`}>
                    Existing labs that are not attached to this course yet.
                  </p>
                </div>
                <Link href="/instructor/labs" className={ins.btnSecondary}>
                  Open lab library
                </Link>
              </div>

              {labsNotInCourse.length === 0 ? (
                <p className="mt-6 text-sm text-stone-600">
                  Every existing lab is already assigned here, or no labs have been created yet.
                </p>
              ) : (
                <ul className="mt-6 space-y-3">
                  {labsNotInCourse.map((lab) => (
                    <li key={lab.uid} className={ins.listRow}>
                      <div className="min-w-0">
                        <p className="font-semibold text-stone-900">{lab.title}</p>
                        <p className="mt-1 text-sm text-stone-600">{lab.uid}</p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/instructor/edit_lab/${lab.uid}`}
                          className={ins.btnNeutral}
                        >
                          Open
                        </Link>
                        <button
                          type="button"
                          onClick={() => void onAdd(lab.uid)}
                          disabled={adding === lab.uid}
                          className={ins.btnPrimary}
                        >
                          {adding === lab.uid ? 'Adding...' : 'Add to course'}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function TACourseLabsView({
  backHref,
  course,
  courseId,
  courseLabs,
  loading,
  message,
}: SharedViewProps) {
  return (
    <div className={ins.pageWrapWide}>
      <Link href={backHref} className={ins.backLink}>
        ← Back to courses
      </Link>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className={ins.kicker}>Teaching Assistant</p>
          <h1 className={`${ins.h1} mt-2`}>Assigned course labs</h1>
          <p className={ins.subtitle}>{formatCourseLabel(course, courseId)}</p>
          {course?.term && <p className="mt-1 text-sm text-stone-600">{course.term}</p>}
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href={`/ta/courses/roster?course_id=${encodeURIComponent(courseId)}`}
            className={ins.btnSecondary}
          >
            Roster
          </Link>
          <Link
            href={`/ta/courses/grades?course_id=${encodeURIComponent(courseId)}`}
            className={ins.btnNeutral}
          >
            Grades
          </Link>
          <Link
            href={`/ta/student-labs-root?course_id=${encodeURIComponent(courseId)}`}
            className={ins.btnNeutral}
          >
            Review students
          </Link>
        </div>
      </header>

      <section className={`${ins.card} ${ins.cardPad}`}>
        <p className="text-sm text-stone-700">
          Labs are read-only for TAs. Use this page to open submissions, inspect recent work,
          and move into grading or student review without changing which labs are assigned.
        </p>
      </section>

      {message && (
        <div className={message.success ? ins.msgOk : ins.msgErr}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className={`${ins.card} ${ins.cardPad} flex flex-col items-center py-12`}>
          <div className={ins.spinner} />
          <p className="mt-4 text-sm text-stone-600">Loading course labs...</p>
        </div>
      ) : courseLabs.length === 0 ? (
        <div className={`${ins.card} ${ins.cardPad}`}>
          <h2 className={ins.h2Card}>No labs assigned</h2>
          <p className="mt-2 text-sm text-stone-600">
            This course does not currently have any labs available for review.
          </p>
        </div>
      ) : (
        <section className={`${ins.card} overflow-hidden`}>
          <div className="border-b border-amber-100 px-6 py-5">
            <h2 className={ins.h2Card}>Assigned labs</h2>
            <p className="mt-1 text-sm text-stone-600">
              Open submissions for a lab, then review recent attempts or drill into a student
              workspace.
            </p>
          </div>
          <ul className={ins.divideList}>
            {courseLabs.map((lab) => (
              <li
                key={lab.lab_uid}
                className="flex flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-stone-900">{lab.title}</p>
                  <p className="mt-1 text-sm text-stone-600">{lab.lab_uid}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link
                    href={`/ta/courses/submissions?course_id=${encodeURIComponent(courseId)}&lab_uid=${encodeURIComponent(lab.lab_uid)}`}
                    className={ins.btnSecondary}
                  >
                    Open submissions
                  </Link>
                  <Link
                    href={`/ta/courses/grades?course_id=${encodeURIComponent(courseId)}&lab_uid=${encodeURIComponent(lab.lab_uid)}`}
                    className={ins.btnNeutral}
                  >
                    Grade tools
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StaffCourseLabsPageContent(props: StaffCourseLabsPageProps) {
  const { portal, canManageLabs } = props;
  const searchParams = useSearchParams();
  const courseId = searchParams.get('course_id')?.trim() ?? '';
  const [course, setCourse] = useState<Course | null>(null);
  const [courseLabs, setCourseLabs] = useState<CourseLab[]>([]);
  const [allLabs, setAllLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<FlashMessage | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const backHref = `/${portal}/courses`;

  const load = useCallback(async () => {
    if (!isValidCourseId(courseId)) {
      setCourse(null);
      setCourseLabs([]);
      setAllLabs([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const coursesPromise = portal === 'ta' ? listStaffCourses() : listCourses();
      const courseLabsPromise = getCourseLabs(courseId);

      const [coursesRes, labsRes, allRes] = canManageLabs
        ? await Promise.all([coursesPromise, courseLabsPromise, listLabs()])
        : await Promise.all([coursesPromise, courseLabsPromise, Promise.resolve(null)]);

      if (coursesRes.success && coursesRes.courses) {
        setCourse(coursesRes.courses.find((entry) => entry.course_id === courseId) ?? null);
      } else {
        setCourse(null);
      }

      if (labsRes.success && labsRes.labs) {
        setCourseLabs(labsRes.labs);
      } else {
        setCourseLabs([]);
        if (labsRes.message) {
          setMessage({ success: false, text: labsRes.message });
        }
      }

      if (canManageLabs && allRes?.success && allRes.labs) {
        setAllLabs(allRes.labs);
      } else {
        setAllLabs([]);
        if (canManageLabs && allRes && !allRes.success) {
          setMessage({
            success: false,
            text: allRes.message ?? 'Failed to load available labs.',
          });
        }
      }
    } catch (error) {
      setCourse(null);
      setCourseLabs([]);
      setAllLabs([]);
      setMessage({
        success: false,
        text: error instanceof Error ? error.message : 'Failed to load course labs.',
      });
    } finally {
      setLoading(false);
    }
  }, [canManageLabs, courseId, portal]);

  useEffect(() => {
    void load();
  }, [load]);

  const inCourse = new Set(courseLabs.map((lab) => lab.lab_uid));
  const labsNotInCourse = allLabs.filter((lab) => !inCourse.has(lab.uid));

  const handleAdd = async (labUid: string) => {
    if (!canManageLabs) return;

    setMessage(null);
    setAdding(labUid);
    try {
      const result = await addCourseLab({ course_id: courseId, lab_uid: labUid });
      setMessage({
        success: result.success,
        text: result.message ?? (result.success ? 'Lab added to course.' : 'Failed to add lab.'),
      });
      if (result.success) {
        await load();
      }
    } catch (error) {
      setMessage({
        success: false,
        text: error instanceof Error ? error.message : 'Failed to add lab.',
      });
    } finally {
      setAdding(null);
    }
  };

  const handleRemove = async (labUid: string) => {
    if (!canManageLabs) return;

    setMessage(null);
    setRemoving(labUid);
    try {
      const result = await removeCourseLab({ course_id: courseId, lab_uid: labUid });
      setMessage({
        success: result.success,
        text: result.message ?? (result.success ? 'Lab removed from course.' : 'Failed to remove lab.'),
      });
      if (result.success) {
        await load();
      }
    } catch (error) {
      setMessage({
        success: false,
        text: error instanceof Error ? error.message : 'Failed to remove lab.',
      });
    } finally {
      setRemoving(null);
    }
  };

  if (!isValidCourseId(courseId)) {
    return portal === 'instructor' ? (
      <div className={`${ins.pageWrapMd} max-w-3xl`}>
        <Link href={backHref} className={ins.backLink}>
          ← Back to courses
        </Link>
        <div className={`${ins.card} ${ins.cardPad} mt-6`}>
          <h1 className={ins.h2}>Invalid course</h1>
          <p className="mt-2 text-sm text-stone-600">
            A valid 5-digit course ID is required to manage course labs.
          </p>
        </div>
      </div>
    ) : (
      <div className={`${ins.pageWrapMd} max-w-3xl`}>
        <Link href={backHref} className={ins.backLink}>
          ← Back to courses
        </Link>
        <div className={`${ins.card} ${ins.cardPad} mt-6`}>
          <h1 className={ins.h2}>Invalid course</h1>
          <p className="mt-2 text-sm text-stone-600">
            A valid assigned course must be selected before opening TA lab tools.
          </p>
        </div>
      </div>
    );
  }

  const sharedProps: SharedViewProps = {
    backHref,
    canManageLabs,
    course,
    courseId,
    courseLabs,
    labsNotInCourse,
    loading,
    message,
    adding,
    removing,
    portal,
    onAdd: handleAdd,
    onRemove: handleRemove,
  };

  return portal === 'instructor' ? (
    <InstructorCourseLabsView {...sharedProps} />
  ) : (
    <TACourseLabsView {...sharedProps} />
  );
}

export default function StaffCourseLabsPage(props: StaffCourseLabsPageProps) {
  return (
    <Suspense
      fallback={
        props.portal === 'instructor' ? (
          <div className={ins.pageWrapMd}>
            <div className={`${ins.card} ${ins.cardPad} text-stone-600`}>
              <p>Loading...</p>
            </div>
          </div>
        ) : (
          <div className="min-h-screen bg-slate-50 p-8">
            <p className="text-slate-500">Loading...</p>
          </div>
        )
      }
    >
      <StaffCourseLabsPageContent {...props} />
    </Suspense>
  );
}
