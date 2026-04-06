'use client';

import { useState } from 'react';
import Link from 'next/link';
import { logout } from '@/app/logout/frontend';

export default function InstructorPage() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logout();
    } finally {
      window.location.href = '/login';
    }
  };

  const header = (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Instructor</p>
        <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">
          Manage labs, users, and access admin controls.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-medium shadow-sm transition ${
            isLoggingOut
              ? 'cursor-not-allowed bg-slate-200 text-slate-500'
              : 'bg-slate-900 text-white hover:bg-slate-800'
          }`}
        >
          {isLoggingOut ? 'Logging out...' : 'Log out'}
        </button>
      </div>
    </div>
  );

  const quickActions = (
    <section className="grid gap-4 md:grid-cols-3">
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Labs</p>
        <h2 className="mt-2 text-lg font-semibold text-slate-900">Lab Management</h2>
        <p className="mt-2 text-sm text-slate-600">
          Create, edit, and remove labs and test cases.
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link
            href="/instructor/labs"
            className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            View/Edit labs
          </Link>
          <Link
            href="/instructor/student-labs-root"
            className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Review student labs
          </Link>
        </div>
      </div>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Users</p>
        <h2 className="mt-2 text-lg font-semibold text-slate-900">User Management</h2>
        <p className="mt-2 text-sm text-slate-600">
          Create instructor accounts and manage access.
        </p>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link
            href="/instructor/create_user"
            className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Create New User
          </Link>
          <Link
            href="/instructor/user_search"
            className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Search users
          </Link>
        </div>
      </div>
      <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Admin Controls</h2>
        <p className="mt-1 text-sm text-slate-500">
          Administrative Actions.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/instructor/manage_roles"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Manage Roles
          </Link>
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-400"
          >
            future potential button
          </button>
          <button
            type="button"
            disabled
            className="cursor-not-allowed rounded-md border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-medium text-slate-400"
          >
            future potential button
          </button>
        </div>
      </section>
    </section>

  );

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl p-8 space-y-8">
        {header}
        {quickActions}

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Course Controls</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage course-wide settings, roster visibility, and grading policies.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/instructor/courses/create"
              className="inline-flex rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Create New Course
            </Link>
            <Link
              href="/instructor/courses"
              className="inline-flex rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              View/Edit Courses
            </Link>
            <Link
              href="/instructor/courses/add_member"
              className="inline-flex rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Add Student to Course
            </Link>
            <Link
              href="/instructor/courses/drop_member"
              className="inline-flex rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              Drop Student from Course
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
