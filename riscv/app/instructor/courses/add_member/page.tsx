'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { listCourses } from '@/app/api/list_courses/frontend';
import { searchUsers } from '@/app/instructor/user_search/api/frontend';
import { addCourseMember } from '@/app/api/add_course_member/frontend';
import type { Course } from '@/app/api/list_courses/types';
import type { UserSearchResult } from '@/app/instructor/user_search/api/types';
import { ins } from '@/components/instructor-shell';

type Role = 'student' | 'instructor' | 'ta';

function AddMemberPageContent() {
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
    <div className={ins.pageWrapSm}>
      <Link href="/instructor" className={ins.backLink}>
        ← Back to dashboard
      </Link>
      <h1 className={`${ins.h1} mt-4`}>Add Student / TA / Instructor to Course</h1>
      <p className={ins.subtitle}>Select course, search for a user, choose role, then add.</p>

      {message && (
        <div className={`mt-4 ${message.success ? ins.msgOk : ins.msgErr}`}>
          {message.text}
        </div>
      )}

      <div className={`mt-6 space-y-4 ${ins.card} ${ins.cardPad}`}>
        <div>
          <label className={ins.label}>Course</label>
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className={ins.select}
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
          <label className={ins.label}>Role to assign</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className={ins.select}
          >
            <option value="student">Student</option>
            <option value="ta">TA</option>
            <option value="instructor">Instructor</option>
          </select>
        </div>

        <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by username"
            className={`flex-1 min-w-[12rem] ${ins.inputInline}`}
          />
          <button type="submit" disabled={searching} className={ins.btnPrimary}>
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {users.length > 0 && (
          <div>
            <p className="text-sm font-medium text-stone-900">Results — click Add to add to course</p>
            <ul className="mt-2 space-y-2">
              {users.map((u) => (
                <li key={u.username} className={ins.listRow}>
                  <span className="font-medium text-stone-900">{u.username}</span>
                  <span className="text-xs text-stone-600">{u.instructor ? 'Instructor' : 'Student'}</span>
                  <button
                    type="button"
                    onClick={() => handleAdd(u.username)}
                    disabled={adding === u.username}
                    className={`${ins.btnPrimary} shrink-0 text-xs py-2 px-3`}
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
  );
}

export default function AddMemberPage() {
  return (
    <Suspense
      fallback={
        <div className={`${ins.pageWrapSm} text-stone-600`}>
          <p>Loading...</p>
        </div>
      }
    >
      <AddMemberPageContent />
    </Suspense>
  );
}
