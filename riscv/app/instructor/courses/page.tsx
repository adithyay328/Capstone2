'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { listCourses } from '@/app/api/list_courses/frontend';
import { updateCourse } from '@/app/api/update_course/frontend';
import type { Course } from '@/app/api/list_courses/types';

export default function ViewEditCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editTerm, setEditTerm] = useState('');
  const [saving, setSaving] = useState(false);

  const loadCourses = async () => {
    setLoading(true);
    const res = await listCourses();
    if (res.success && res.courses) setCourses(res.courses);
    setLoading(false);
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const startEdit = (c: Course) => {
    setEditingId(c.course_id);
    setEditCode(c.code);
    setEditTitle(c.title);
    setEditTerm(c.term ?? '');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    setMessage(null);
    try {
      const result = await updateCourse({
        course_id: editingId,
        code: editCode.trim(),
        title: editTitle.trim(),
        term: editTerm.trim() || undefined,
      });
      setMessage({ success: result.success, text: result.message || (result.success ? 'Saved.' : 'Failed.') });
      if (result.success) {
        setEditingId(null);
        loadCourses();
      }
    } catch (err) {
      setMessage({ success: false, text: err instanceof Error ? err.message : 'Error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl p-8">
        <Link href="/instructor" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          ← Back to dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">View / Edit Courses</h1>
        <p className="mt-1 text-sm text-slate-600">Edit course details or manage roster from here.</p>

        {message && (
          <div
            className={`mt-4 rounded-md p-3 ${message.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
          >
            {message.text}
          </div>
        )}

        {loading ? (
          <p className="mt-6 text-slate-500">Loading courses...</p>
        ) : courses.length === 0 ? (
          <p className="mt-6 text-slate-500">No courses yet. Create one from the dashboard.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {courses.map((c) => (
              <li
                key={c.course_id}
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
              >
                {editingId === c.course_id ? (
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm font-medium text-slate-500">Course ID: {c.course_id}</span>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500">Code</label>
                      <input
                        value={editCode}
                        onChange={(e) => setEditCode(e.target.value)}
                        className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500">Title</label>
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-500">Term</label>
                      <input
                        value={editTerm}
                        onChange={(e) => setEditTerm(e.target.value)}
                        className="mt-1 w-full rounded border border-slate-300 bg-white px-2 py-1 text-sm text-slate-900"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={saveEdit}
                        disabled={saving}
                        className="rounded bg-slate-900 px-3 py-1 text-sm text-white disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded border border-slate-300 px-3 py-1 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="font-medium text-slate-900">{c.code}</span>
                      <span className="ml-2 text-slate-500">({c.course_id})</span>
                      <p className="text-sm text-slate-600">{c.title}</p>
                      {c.term && <p className="text-xs text-slate-400">{c.term}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(c)}
                        className="rounded border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50"
                      >
                        Edit
                      </button>
                      <Link
                        href={`/instructor/courses/roster?course_id=${c.course_id}`}
                        className="rounded border border-slate-300 bg-white px-3 py-1 text-sm hover:bg-slate-50"
                      >
                        Roster
                      </Link>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
