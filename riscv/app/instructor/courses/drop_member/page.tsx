'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { listCourses } from '@/app/api/list_courses/frontend';
import { getCourseMembers } from '@/app/api/course_members/frontend';
import { removeCourseMember } from '@/app/api/remove_course_member/frontend';
import type { Course } from '@/app/api/list_courses/types';
import type { CourseMember } from '@/app/api/course_members/types';

export default function DropMemberPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState('');
  const [members, setMembers] = useState<CourseMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    listCourses().then((res) => {
      if (res.success && res.courses) setCourses(res.courses);
    });
  }, []);

  useEffect(() => {
    if (!courseId || !/^[0-9]{5}$/.test(courseId)) {
      setMembers([]);
      return;
    }
    setLoadingMembers(true);
    getCourseMembers(courseId).then((res) => {
      if (res.success && res.members) setMembers(res.members);
      else setMembers([]);
      setLoadingMembers(false);
    });
  }, [courseId]);

  const handleRemove = async (username: string) => {
    setMessage(null);
    setRemoving(username);
    try {
      const result = await removeCourseMember({ course_id: courseId, username });
      setMessage({ success: result.success, text: result.message || (result.success ? 'Dropped.' : 'Failed.') });
      if (result.success) {
        setMembers((prev) => prev.filter((m) => m.username !== username));
      }
    } catch (err) {
      setMessage({ success: false, text: err instanceof Error ? err.message : 'Error' });
    } finally {
      setRemoving(null);
    }
  };

  const course = courses.find((c) => c.course_id === courseId);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-xl p-8">
        <Link href="/instructor" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          ← Back to dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Drop Student from Course</h1>
        <p className="mt-1 text-sm text-slate-600">Select a course, then remove a member from the roster.</p>

        {message && (
          <div
            className={`mt-4 rounded-md p-3 ${message.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
          >
            {message.text}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Course</label>
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900"
            >
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={c.course_id} value={c.course_id}>
                  {c.code} — {c.title}
                </option>
              ))}
            </select>
          </div>

          {courseId && (
            <div>
              {loadingMembers ? (
                <p className="text-slate-500">Loading roster...</p>
              ) : members.length === 0 ? (
                <p className="text-slate-500">No members in this course.</p>
              ) : (
                <ul className="space-y-2">
                  {members.map((m) => (
                    <li
                      key={m.username}
                      className="flex items-center justify-between rounded border border-slate-200 bg-white px-4 py-2"
                    >
                      <span className="font-medium">{m.username}</span>
                      <span className="text-sm text-slate-500">{m.role}</span>
                      <button
                        type="button"
                        onClick={() => handleRemove(m.username)}
                        disabled={removing === m.username}
                        className="rounded border border-red-200 bg-red-50 px-2 py-1 text-sm text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        {removing === m.username ? 'Dropping...' : 'Drop'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
