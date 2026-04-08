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

  return (
    <div className="min-h-screen">
      <header className="border-b border-amber-200/90 bg-white/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div>
            <p className={ins.kicker}>Instructor</p>
            <h1 className={`${ins.h1} mt-1`}>Dashboard</h1>
          </div>
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
