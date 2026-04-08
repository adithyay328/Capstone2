'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiBook, FiLayers, FiLogOut, FiShield, FiUsers } from 'react-icons/fi';
import { logout } from '@/app/logout/frontend';
import { ins } from '@/components/instructor-shell';

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
          <Link
            href="/instructor/simulator"
            className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Open simulator sandbox
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
            onClick={handleLogout}
            disabled={isLoggingOut}
            className={
              isLoggingOut
                ? ins.btnDisabled
                : `${ins.btnSecondary} inline-flex items-center gap-2`
            }
          >
            <FiLogOut className="h-4 w-4" aria-hidden />
            {isLoggingOut ? 'Logging out…' : 'Log out'}
          </button>
        </div>
      </header>

      <div className={ins.pageWrap}>
        <p className={`${ins.subtitle} max-w-2xl`}>
          Manage labs, users, course rosters, and roles from here. Open a section to continue.
        </p>

        <section aria-labelledby="dash-sections">
          <h2 id="dash-sections" className="sr-only">
            Dashboard sections
          </h2>
          <div className="grid gap-5 lg:grid-cols-3">
            <article
              className={`${ins.card} ${ins.cardPad} flex flex-col transition hover:border-amber-300 hover:shadow-md`}
            >
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm">
                  <FiBook className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={ins.kicker}>Labs</p>
                  <h3 className={`${ins.h2Card} mt-1`}>Lab management</h3>
                  <p className={`${ins.subtitleMuted} mt-2`}>
                    Create and edit labs, instructions, and autograding test cases.
                  </p>
                </div>
              </div>
              <div className="mt-6 border-t border-amber-100 pt-5">
                <Link href="/instructor/labs" className={ins.linkAccent}>
                  View / edit labs →
                </Link>
              </div>
            </article>

            <article
              className={`${ins.card} ${ins.cardPad} flex flex-col transition hover:border-amber-300 hover:shadow-md`}
            >
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-sm">
                  <FiUsers className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={ins.kicker}>Users</p>
                  <h3 className={`${ins.h2Card} mt-1`}>User management</h3>
                  <p className={`${ins.subtitleMuted} mt-2`}>
                    Create accounts and search the directory by role or course.
                  </p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-amber-100 pt-5">
                <Link href="/instructor/create_user" className={ins.linkAccent}>
                  Create user
                </Link>
                <Link href="/instructor/user_search" className={ins.linkAccent}>
                  Search users
                </Link>
              </div>
            </article>

            <article
              className={`${ins.card} ${ins.cardPad} flex flex-col transition hover:border-amber-300 hover:shadow-md`}
            >
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-600 to-orange-600 text-white shadow-sm">
                  <FiShield className="h-5 w-5" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={ins.kicker}>Roles</p>
                  <h3 className={`${ins.h2Card} mt-1`}>Course roles</h3>
                  <p className={`${ins.subtitleMuted} mt-2`}>
                    Update membership roles (for example student or TA) within a course.
                  </p>
                </div>
              </div>
              <div className="mt-6 border-t border-amber-100 pt-5">
                <Link href="/instructor/manage_roles" className={ins.btnPrimary}>
                  Manage roles
                </Link>
              </div>
            </article>
          </div>
        </section>

        <section className={`${ins.card} ${ins.cardPad}`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-900">
                <FiLayers className="h-5 w-5" aria-hidden />
              </span>
              <div>
                <h2 className={ins.h2}>Courses</h2>
                <p className={`${ins.subtitleMuted} mt-1 max-w-2xl`}>
                  Create courses, assign labs, and manage enrollment.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/instructor/courses/create" className={`${ins.btnNeutral} justify-center py-3`}>
              Create course
            </Link>
            <Link href="/instructor/courses" className={`${ins.btnNeutral} justify-center py-3`}>
              View / edit courses
            </Link>
            <Link href="/instructor/courses/add_member" className={`${ins.btnNeutral} justify-center py-3`}>
              Add to course
            </Link>
            <Link href="/instructor/courses/drop_member" className={`${ins.btnNeutral} justify-center py-3`}>
              Remove from course
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
