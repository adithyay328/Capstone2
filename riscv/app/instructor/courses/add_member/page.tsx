'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { listCourses } from '@/app/api/list_courses/frontend';
import { searchUsers } from '@/app/instructor/user_search/api/frontend';
import { addCourseMember } from '@/app/api/add_course_member/frontend';
import type { Course } from '@/app/api/list_courses/types';
import type { UserSearchResult } from '@/app/instructor/user_search/api/types';

type Role = 'student' | 'instructor' | 'ta';

export default function AddMemberPage() {
  const searchParams = useSearchParams();
  const defaultCourseId = searchParams.get('course_id') ?? '';
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseId, setCourseId] = useState(defaultCourseId);
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [role, setRole] = useState<Role>('student');
  const [adding, setAdding] = useState<string | null>(null);
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);

  useEffect(() => {
    listCourses().then((res) => {
      if (res.success && res.courses) setCourses(res.courses);
    });
    if (defaultCourseId) setCourseId(defaultCourseId);
  }, [defaultCourseId]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearching(true);
    setMessage(null);
    try {
      const res = await searchUsers({ query: query.trim() || undefined, role: 'any' });
      if (res.success && res.users) setUsers(res.users);
      else setUsers([]);
    } catch {
      setUsers([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (username: string) => {
    if (!courseId || !/^[0-9]{5}$/.test(courseId)) {
      setMessage({ success: false, text: 'Select a course first' });
      return;
    }
    setMessage(null);
    setAdding(username);
    try {
      const result = await addCourseMember({ course_id: courseId, username, role });
      setMessage({ success: result.success, text: result.message || (result.success ? 'Added.' : 'Failed.') });
    } catch (err) {
      setMessage({ success: false, text: err instanceof Error ? err.message : 'Error' });
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-xl p-8">
        <Link href="/instructor" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          ← Back to dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Add Student / TA / Instructor to Course</h1>
        <p className="mt-1 text-sm text-slate-600">Select course, search for a user, choose role, then add.</p>

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

          <div>
            <label className="block text-sm font-medium text-slate-700">Role to assign</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900"
            >
              <option value="student">Student</option>
              <option value="ta">TA</option>
              <option value="instructor">Instructor</option>
            </select>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by username"
              className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={searching}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </form>

          {users.length > 0 && (
            <div>
              <p className="text-sm font-medium text-slate-700">Results — click Add to add to course</p>
              <ul className="mt-2 space-y-1">
                {users.map((u) => (
                  <li
                    key={u.username}
                    className="flex items-center justify-between rounded border border-slate-200 bg-white px-3 py-2"
                  >
                    <span>{u.username}</span>
                    <span className="text-xs text-slate-500">{u.instructor ? 'Instructor' : 'Student'}</span>
                    <button
                      type="button"
                      onClick={() => handleAdd(u.username)}
                      disabled={adding === u.username}
                      className="rounded bg-indigo-600 px-2 py-1 text-sm text-white hover:bg-indigo-700 disabled:opacity-50"
                    >
                      {adding === u.username ? 'Adding...' : 'Add'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
