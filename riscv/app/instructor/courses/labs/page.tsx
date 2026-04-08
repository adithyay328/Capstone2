'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { listCourses } from '@/app/api/list_courses/frontend';
import { getCourseLabs, type CourseLab } from '@/app/api/course_labs/frontend';
import { listLabs } from '@/app/api/list_labs/frontend';
import type { Course } from '@/app/api/list_courses/types';
import type { Lab } from '@/app/api/list_labs/types';
import { ins } from '@/components/instructor-shell';
import StaffCourseLabsPage from '@/components/staff-course-labs-page';
        
function CourseLabsPageContent() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('course_id') ?? '';
  const [course, setCourse] = useState<Course | null>(null);
  const [courseLabs, setCourseLabs] = useState<CourseLab[]>([]);
  const [allLabs, setAllLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!courseId || !/^[0-9]{5}$/.test(courseId)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [coursesRes, labsRes, allRes] = await Promise.all([
        listCourses(),
        getCourseLabs(courseId),
        listLabs(),
      ]);
      if (coursesRes.success && coursesRes.courses) {
        const c = coursesRes.courses.find((x) => x.course_id === courseId);
        setCourse(c ?? null);
      }
      if (labsRes.success && labsRes.labs) setCourseLabs(labsRes.labs);
      else setCourseLabs([]);
      if (allRes.success && allRes.labs) setAllLabs(allRes.labs);
      else setAllLabs([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const inCourse = new Set(courseLabs.map((l) => l.lab_uid));
  const labsNotInCourse = allLabs.filter((l) => !inCourse.has(l.uid));

  const handleAdd = async (lab_uid: string) => {
    setMessage(null);
    setAdding(lab_uid);
    try {
      const res = await fetch('/api/add_course_lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId, lab_uid }),
      });
      const data = await res.json();
      setMessage({ success: data.success, text: data.message || (data.success ? 'Added.' : 'Failed.') });
      if (data.success) load();
    } catch (err) {
      setMessage({ success: false, text: err instanceof Error ? err.message : 'Error' });
    } finally {
      setAdding(null);
    }
  };

  const handleRemove = async (lab_uid: string) => {
    setMessage(null);
    setRemoving(lab_uid);
    try {
      const res = await fetch('/api/remove_course_lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ course_id: courseId, lab_uid }),
      });
      const data = await res.json();
      setMessage({ success: data.success, text: data.message || (data.success ? 'Removed.' : 'Failed.') });
      if (data.success) load();
    } catch (err) {
      setMessage({ success: false, text: err instanceof Error ? err.message : 'Error' });
    } finally {
      setRemoving(null);
    }
  };

  if (!courseId || !/^[0-9]{5}$/.test(courseId)) {
    return (
      <div className={`${ins.pageWrapMd} max-w-3xl`}>
        <Link href="/instructor/courses" className={ins.backLink}>
          ← Back to courses
        </Link>
        <p className="mt-4 text-stone-600">Invalid course.</p>
      </div>
    );
  }
    
  return (
    <div className={`${ins.pageWrapMd} max-w-3xl`}>
      <Link href="/instructor/courses" className={ins.backLink}>
        ← Back to courses
      </Link>
      <h1 className={`${ins.h1} mt-4`}>Labs in this course</h1>
      {course && (
        <p className={ins.subtitle}>
          {course.code} — {course.title}
        </p>
      )}

      {message && (
        <div className={`mt-4 ${message.success ? ins.msgOk : ins.msgErr}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <p className="mt-6 text-stone-600">Loading...</p>
      ) : (
        <>
          <section className="mt-6">
            <h2 className={ins.h2Card}>Assigned labs</h2>
            {courseLabs.length === 0 ? (
              <p className="mt-2 text-sm text-stone-600">No labs assigned yet. Add one below.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {courseLabs.map((l) => (
                  <li key={l.lab_uid} className={ins.listRow}>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-medium text-stone-900">{l.title}</span>
                      <Link href={`/instructor/edit_lab/${l.lab_uid}`} className={ins.linkAccent}>
                        Edit lab
                      </Link>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(l.lab_uid)}
                      disabled={removing === l.lab_uid}
                      className={ins.btnDanger}
                    >
                      {removing === l.lab_uid ? 'Removing...' : 'Remove from course'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="mt-8">
            <h2 className={ins.h2Card}>Add a lab to this course</h2>
            <p className={`${ins.subtitleMuted} mt-1`}>
              Labs created in View/Edit labs that are not yet in this course.
            </p>
            {labsNotInCourse.length === 0 ? (
              <p className="mt-3 text-sm text-stone-600">
                All labs are already in this course, or no labs exist yet.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {labsNotInCourse.map((l) => (
                  <li key={l.uid} className={ins.listRow}>
                    <span className="font-medium text-stone-900">{l.title}</span>
                    <button
                      type="button"
                      onClick={() => handleAdd(l.uid)}
                      disabled={adding === l.uid}
                      className={ins.btnPrimary}
                    >
                      {adding === l.uid ? 'Adding...' : 'Add to course'}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default function CourseLabsPage() {
  return (
    <Suspense
      fallback={
        <div className={`${ins.pageWrapMd} text-stone-600`}>
          <p>Loading...</p>
        </div>
      }
    >
      <CourseLabsPageContent />
    </Suspense>
  );
import StaffCourseLabsPage from '@/components/staff-course-labs-page';

export default function CourseLabsPage() {
  return <StaffCourseLabsPage portal="instructor" canManageLabs />;
}
