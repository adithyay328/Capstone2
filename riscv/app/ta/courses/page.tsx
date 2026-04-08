'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { listCourses } from '@/app/api/list_courses/frontend';
import type { Course } from '@/app/api/list_courses/types';

export default function TACoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCourses() {
      setLoading(true);
      const response = await listCourses();
      if (response.success && response.courses) {
        setCourses(response.courses);
      } else {
        setCourses([]);
      }
      setLoading(false);
    }

    void loadCourses();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl p-8">
        <Link href="/ta" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          Back to dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">View Courses</h1>
        <p className="mt-1 text-sm text-slate-600">Open a course to inspect labs and submissions.</p>

        {loading ? (
          <p className="mt-6 text-slate-500">Loading courses...</p>
        ) : courses.length === 0 ? (
          <p className="mt-6 text-slate-500">No courses available.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {courses.map((course) => (
              <li
                key={course.course_id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-medium text-slate-900">{course.code}</span>
                    <span className="ml-2 text-slate-500">({course.course_id})</span>
                    <p className="text-sm text-slate-600">{course.title}</p>
                    {course.term && <p className="text-xs text-slate-400">{course.term}</p>}
                  </div>
                  <Link
                    href={`/ta/courses/labs?course_id=${course.course_id}`}
                    className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-100"
                  >
                    Labs
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
