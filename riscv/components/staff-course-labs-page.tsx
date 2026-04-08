'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { listCourses } from '@/app/api/list_courses/frontend';
import { getCourseLabs, type CourseLab } from '@/app/api/course_labs/frontend';
import { listLabs } from '@/app/api/list_labs/frontend';
import type { Course } from '@/app/api/list_courses/types';
import type { Lab } from '@/app/api/list_labs/types';

type StaffCourseLabsPageProps = {
  portal: 'instructor' | 'ta';
  canManageLabs: boolean;
};

function StaffCourseLabsPageContent({
  portal,
  canManageLabs,
}: StaffCourseLabsPageProps) {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('course_id') ?? '';
  const [course, setCourse] = useState<Course | null>(null);
  const [courseLabs, setCourseLabs] = useState<CourseLab[]>([]);
  const [allLabs, setAllLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const backHref = `/${portal}/courses`;
  const submissionsBaseHref = `/${portal}/courses/submissions`;

  const load = useCallback(async () => {
    if (!courseId || !/^[0-9]{5}$/.test(courseId)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const coursesPromise = listCourses();
      const labsPromise = getCourseLabs(courseId);

      const [coursesRes, labsRes, allRes] = canManageLabs
        ? await Promise.all([coursesPromise, labsPromise, listLabs()])
        : await Promise.all([coursesPromise, labsPromise, Promise.resolve(null)]);

      if (coursesRes.success && coursesRes.courses) {
        const matchedCourse = coursesRes.courses.find((entry) => entry.course_id === courseId);
        setCourse(matchedCourse ?? null);
      }

      if (labsRes.success && labsRes.labs) setCourseLabs(labsRes.labs);
      else setCourseLabs([]);

      if (canManageLabs && allRes?.success && allRes.labs) setAllLabs(allRes.labs);
      else setAllLabs([]);
    } finally {
      setLoading(false);
    }
  }, [canManageLabs, courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const inCourse = new Set(courseLabs.map((lab) => lab.lab_uid));
  const labsNotInCourse = allLabs.filter((lab) => !inCourse.has(lab.uid));

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
      setMessage({
        success: data.success,
        text: data.message || (data.success ? 'Added.' : 'Failed.'),
      });
      if (data.success) void load();
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
      setMessage({
        success: data.success,
        text: data.message || (data.success ? 'Removed.' : 'Failed.'),
      });
      if (data.success) void load();
    } catch (err) {
      setMessage({ success: false, text: err instanceof Error ? err.message : 'Error' });
    } finally {
      setRemoving(null);
    }
  };

  if (!courseId || !/^[0-9]{5}$/.test(courseId)) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <Link href={backHref} className="text-sm font-semibold text-indigo-600">
          Back to courses
        </Link>
        <p className="mt-4 text-slate-600">Invalid course.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl p-8">
        <Link href={backHref} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          Back to courses
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Labs in this course</h1>
        {course && (
          <p className="mt-1 text-sm text-slate-600">
            {course.code} - {course.title}
          </p>
        )}

        {message && (
          <div
            className={`mt-4 rounded-md p-3 ${message.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <p className="mt-6 text-slate-500">Loading...</p>
        ) : (
          <>
            <section className="mt-6">
              <h2 className="text-lg font-semibold text-slate-900">Assigned labs</h2>
              {courseLabs.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No labs assigned yet.</p>
              ) : (
                <ul className="mt-2 space-y-2">
                  {courseLabs.map((lab) => (
                    <li
                      key={lab.lab_uid}
                      className="flex items-center justify-between rounded border border-slate-200 bg-white px-4 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-slate-900">{lab.title}</span>
                        {canManageLabs && (
                          <Link
                            href={`/instructor/edit_lab/${lab.lab_uid}`}
                            className="text-sm text-indigo-600 hover:text-indigo-700"
                          >
                            Edit lab
                          </Link>
                        )}
                        <Link
                          href={`${submissionsBaseHref}?course_id=${encodeURIComponent(courseId)}&lab_uid=${encodeURIComponent(lab.lab_uid)}`}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          Submissions
                        </Link>
                      </div>
                      {canManageLabs && (
                        <button
                          type="button"
                          onClick={() => handleRemove(lab.lab_uid)}
                          disabled={removing === lab.lab_uid}
                          className="rounded border border-red-200 bg-red-50 px-2 py-1 text-sm text-red-700 hover:bg-red-100 disabled:opacity-50"
                        >
                          {removing === lab.lab_uid ? 'Removing...' : 'Remove from course'}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {canManageLabs && (
              <section className="mt-8">
                <h2 className="text-lg font-semibold text-slate-900">Add a lab to this course</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Labs created in View/Edit labs that are not yet in this course.
                </p>
                {labsNotInCourse.length === 0 ? (
                  <p className="mt-3 text-sm text-slate-500">
                    All labs are already in this course, or no labs exist yet.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-2">
                    {labsNotInCourse.map((lab) => (
                      <li
                        key={lab.uid}
                        className="flex items-center justify-between rounded border border-slate-200 bg-white px-4 py-2"
                      >
                        <span className="font-medium text-slate-900">{lab.title}</span>
                        <button
                          type="button"
                          onClick={() => handleAdd(lab.uid)}
                          disabled={adding === lab.uid}
                          className="rounded bg-slate-900 px-3 py-1 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                        >
                          {adding === lab.uid ? 'Adding...' : 'Add to course'}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function StaffCourseLabsPage(props: StaffCourseLabsPageProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 p-8">
          <p className="text-slate-500">Loading...</p>
        </div>
      }
    >
      <StaffCourseLabsPageContent {...props} />
    </Suspense>
  );
}
