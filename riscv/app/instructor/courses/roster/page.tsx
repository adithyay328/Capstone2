'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getCourseMembers } from '@/app/api/course_members/frontend';
import { removeCourseMember } from '@/app/api/remove_course_member/frontend';
import { listCourses } from '@/app/api/list_courses/frontend';
import type { CourseMember } from '@/app/api/course_members/types';
import type { Course } from '@/app/api/list_courses/types';

function CourseRosterContent() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('course_id') ?? '';
  const [course, setCourse] = useState<Course | null>(null);
  const [members, setMembers] = useState<CourseMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId || !/^[0-9]{5}$/.test(courseId)) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const [coursesRes, membersRes] = await Promise.all([
        listCourses(),
        getCourseMembers(courseId),
      ]);
      if (cancelled) return;
      if (coursesRes.success && coursesRes.courses) {
        const c = coursesRes.courses.find((x) => x.course_id === courseId);
        setCourse(c ?? null);
      }
      if (membersRes.success && membersRes.members) {
        setMembers(membersRes.members);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const handleRemove = async (username: string) => {
    setMessage(null);
    setRemoving(username);
    try {
      const result = await removeCourseMember({ course_id: courseId, username });
      setMessage({ success: result.success, text: result.message || (result.success ? 'Removed.' : 'Failed.') });
      if (result.success) {
        setMembers((prev) => prev.filter((m) => m.username !== username));
      }
    } catch (err) {
      setMessage({ success: false, text: err instanceof Error ? err.message : 'Error' });
    } finally {
      setRemoving(null);
    }
  };

  if (!courseId || !/^[0-9]{5}$/.test(courseId)) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <Link href="/instructor/courses" className="text-sm font-semibold text-indigo-600">
          ← Back to courses
        </Link>
        <p className="mt-4 text-slate-600">Invalid course.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-2xl p-8">
        <Link href="/instructor/courses" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          ← Back to courses
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Course Roster</h1>
        {course && (
          <p className="mt-1 text-sm text-slate-600">
            {course.code} — {course.title}
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
          <div className="mt-6">
            <Link
              href={`/instructor/courses/add_member?course_id=${courseId}`}
              className="inline-block rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Add user to this course
            </Link>
            {members.length === 0 ? (
              <p className="mt-4 text-slate-500">No members yet.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {members.map((m) => (
                  <li
                    key={m.username}
                    className="flex items-center justify-between rounded border border-slate-200 bg-white px-4 py-2"
                  >
                    <span className="font-medium text-slate-900">{m.username}</span>
                    <span className="text-sm text-slate-700">{m.role}</span>
                    <div className="flex items-center gap-3">
                      {m.role === 'student' && (
                        <Link
                          href={`/instructor/student-labs-root?course_id=${encodeURIComponent(courseId)}&student_username=${encodeURIComponent(m.username)}`}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          Review labs
                        </Link>
                      )}
                    <button
                      type="button"
                      onClick={() => handleRemove(m.username)}
                      disabled={removing === m.username}
                      className="rounded border border-red-200 bg-red-50 px-2 py-1 text-sm text-red-700 hover:bg-red-100 disabled:opacity-50"
                    >
                      {removing === m.username ? 'Removing...' : 'Drop'}
                    </button>
                      
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CourseRosterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 p-8">
          <p className="text-slate-500">Loading...</p>
        </div>
      }
    >
      <CourseRosterContent />
    </Suspense>
  );
}
