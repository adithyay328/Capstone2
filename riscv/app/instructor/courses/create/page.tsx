'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createCourse } from '@/app/api/create_course/frontend';

export default function CreateCoursePage() {
  const [courseId, setCourseId] = useState('');
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [term, setTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!/^[0-9]{5}$/.test(courseId)) {
      setMessage({ success: false, text: 'Course ID must be exactly 5 digits' });
      return;
    }
    setSubmitting(true);
    try {
      const result = await createCourse({
        course_id: courseId,
        code: code.trim(),
        title: title.trim(),
        term: term.trim() || undefined,
      });
      setMessage({ success: result.success, text: result.message || (result.success ? 'Course created.' : 'Failed.') });
      if (result.success) {
        setCourseId('');
        setCode('');
        setTitle('');
        setTerm('');
      }
    } catch (err) {
      setMessage({ success: false, text: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-xl p-8">
        <Link href="/instructor" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
          ← Back to dashboard
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Create New Course</h1>
        <p className="mt-1 text-sm text-slate-600">Course ID must be 5 digits (e.g. 10101).</p>

        {message && (
          <div
            className={`mt-4 rounded-md p-3 ${message.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="course_id" className="block text-sm font-medium text-slate-700">
              Course ID (5 digits)
            </label>
            <input
              id="course_id"
              type="text"
              maxLength={5}
              value={courseId}
              onChange={(e) => setCourseId(e.target.value.replace(/\D/g, ''))}
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400"
              required
            />
          </div>
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-slate-700">
              Code
            </label>
            <input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. CS101"
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400"
              required
            />
          </div>
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Introduction to RISC-V"
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400"
              required
            />
          </div>
          <div>
            <label htmlFor="term" className="block text-sm font-medium text-slate-700">
              Term (optional)
            </label>
            <input
              id="term"
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="e.g. Fall 2025"
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Course'}
            </button>
            <Link
              href="/instructor"
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
