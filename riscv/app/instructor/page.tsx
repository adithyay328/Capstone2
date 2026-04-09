'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FiBook, FiLayers, FiLogOut, FiShield } from 'react-icons/fi';
import { logout } from '@/app/logout/frontend';
import StaffGradeRosterPanel from '@/components/staff-grade-roster-panel';
import { ins } from '@/components/instructor-shell';

type DashboardCard = {
  href: string;
  title: string;
  description: string;
  icon: typeof FiBook;
  actions: Array<{ href: string; label: string }>;
};

const DASHBOARD_CARDS: DashboardCard[] = [
  {
    href: '/instructor/labs',
    title: 'Labs',
    description: 'Create lab definitions, update test cases, and review individual student work.',
    icon: FiBook,
    actions: [
      { href: '/instructor/labs', label: 'View / edit labs' },
      { href: '/instructor/student-labs-root', label: 'Review student labs' },
      { href: '/instructor/simulator', label: 'Open simulator' },
    ],
  },
  {
    href: '/instructor/courses',
    title: 'Courses',
    description: 'Manage rosters, assign labs, and open course-level admin workflows.',
    icon: FiLayers,
    actions: [
      { href: '/instructor/courses/create', label: 'Create course' },
      { href: '/instructor/courses', label: 'View / edit courses' },
      { href: '/instructor/courses/add_member', label: 'Add user to course' },
      { href: '/instructor/courses/drop_member', label: 'Remove user from course' },
    ],
  },
];

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
    <div className={ins.pageWrap}>
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className={ins.kicker}>Instructor</p>
          <h1 className={`${ins.h1} mt-2`}>Admin Dashboard</h1>
          <p className={`${ins.subtitle} max-w-2xl`}>
            Manage course setup, lab rollout, and account administration from one place.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/instructor/courses" className={ins.btnSecondary}>
            Open courses
          </Link>
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
            {isLoggingOut ? 'Logging out...' : 'Log out'}
          </button>
        </div>
      </header>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,1fr)]">
        <article className={`${ins.card} ${ins.cardPad}`}>
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm">
              <FiLayers className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className={ins.kicker}>Course Operations</p>
              <h2 className={`${ins.h2} mt-1`}>Daily instructor flow</h2>
              <p className={`${ins.subtitleMuted} mt-2 max-w-2xl`}>
                Start from courses when you need to assign labs, inspect a roster, or open grading views.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Link href="/instructor/courses/create" className={`${ins.btnNeutral} justify-center py-3`}>
              Create course
            </Link>
            <Link href="/instructor/courses" className={`${ins.btnNeutral} justify-center py-3`}>
              View / edit courses
            </Link>
            <Link href="/instructor/courses/add_member" className={`${ins.btnNeutral} justify-center py-3`}>
              Add user to course
            </Link>
            <Link href="/instructor/courses/drop_member" className={`${ins.btnNeutral} justify-center py-3`}>
              Remove user from course
            </Link>
          </div>

          <div className="mt-6 border-t border-amber-100 pt-5">
            <p className={ins.labelCaps}>Grade Export</p>
            <p className="mt-2 text-sm text-stone-700">
              Open the roster-grade export tool directly from course operations.
            </p>
            <StaffGradeRosterPanel
              portal="instructor"
              compact
              triggerLabel="Course lab grade export"
            />
          </div>
        </article>

        <article className={`${ins.card} ${ins.cardPad}`}>
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-600 to-orange-700 text-white shadow-sm">
              <FiShield className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className={ins.kicker}>Admin Controls</p>
              <h2 className={`${ins.h2} mt-1`}>Access management</h2>
              <p className={`${ins.subtitleMuted} mt-2`}>
                Maintain account access and course-role assignments from the same control surface.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Link href="/instructor/manage_roles" className={ins.btnPrimary}>
              Manage roles
            </Link>
            <Link href="/instructor/user_search" className={ins.btnSecondary}>
              Search users
            </Link>
            <Link href="/instructor/create_user" className={ins.btnNeutral}>
              Create user
            </Link>
          </div>
        </article>
      </section>

      <section aria-labelledby="dashboard-sections">
        <h2 id="dashboard-sections" className="sr-only">
          Dashboard sections
        </h2>

        <div className="grid gap-5 lg:grid-cols-2">
          {DASHBOARD_CARDS.map((card) => {
            const Icon = card.icon;

            return (
              <article
                key={card.title}
                className={`${ins.card} ${ins.cardPad} flex flex-col transition hover:border-amber-300 hover:shadow-md`}
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-sm">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={ins.kicker}>{card.title}</p>
                    <h3 className={`${ins.h2Card} mt-1`}>{card.title}</h3>
                    <p className={`${ins.subtitleMuted} mt-2`}>{card.description}</p>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-amber-100 pt-5">
                  <Link href={card.href} className={ins.linkAccent}>
                    Open {card.title.toLowerCase()}
                  </Link>
                  {card.actions.map((action) => (
                    <Link key={action.href} href={action.href} className={ins.linkAccent}>
                      {action.label}
                    </Link>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
