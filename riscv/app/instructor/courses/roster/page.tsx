'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getCourseMembers } from '@/app/api/course_members/frontend';
import { removeCourseMember } from '@/app/api/remove_course_member/frontend';
import { listCourses } from '@/app/api/list_courses/frontend';
import type { CourseMember } from '@/app/api/course_members/types';
import type { Course } from '@/app/api/list_courses/types';
import { ins } from '@/components/instructor-shell';

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
      <div className={`${ins.pageWrapMd} max-w-2xl`}>
        <Link href="/instructor/courses" className={ins.backLink}>
          ← Back to courses
        </Link>
        <p className="mt-4 text-stone-600">Invalid course.</p>
      </div>
    );
  }

  return (
    <div className={`${ins.pageWrapMd} max-w-2xl`}>
      <Link href="/instructor/courses" className={ins.backLink}>
        ← Back to courses
      </Link>
      <h1 className={`${ins.h1} mt-4`}>Course Roster</h1>
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
        <div className="mt-6">
          <Link
            href={`/instructor/courses/add_member?course_id=${courseId}`}
            className={ins.btnPrimary}
          >
            Add user to this course
          </Link>
          <div className="mt-3">
            <Link
              href={`/instructor/courses/grades?course_id=${courseId}&lab_uid=lab0-intro-addition`}
              className={ins.btnSecondary}
            >
              View Lab 0 grades
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
          {members.length === 0 ? (
            <p className="mt-4 text-stone-600">No members yet.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {members.map((m) => (
                <li key={m.username} className={ins.listRow}>
                  <span className="font-medium text-stone-900">{m.username}</span>
                  <span className="text-sm text-stone-600">{m.role}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(m.username)}
                    disabled={removing === m.username}
                    className={ins.btnDanger}
                  >
                    {removing === m.username ? 'Removing...' : 'Drop'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default function CourseRosterPage() {
  return (
    <Suspense
      fallback={
        <div className={`${ins.pageWrapMd} text-stone-600`}>
          <p>Loading...</p>
        </div>
      }
    >
      <CourseRosterContent />
    </Suspense>
  );
}
