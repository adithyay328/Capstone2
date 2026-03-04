'use client';

import { useState } from 'react';
import { logout } from '@/app/logout/frontend';

export default function TADashboardPage() {
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
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl p-8 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Teaching Assistant</p>
            <h1 className="text-3xl font-bold text-slate-900">TA Dashboard</h1>
            <p className="text-sm text-slate-600">
              Overview of TA responsibilities and section assignments.
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

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Sections</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">Assigned Sections</h2>
            <p className="mt-2 text-sm text-slate-600">
              Your assigned course sections will appear here.
            </p>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Students</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">Student Support</h2>
            <p className="mt-2 text-sm text-slate-600">
              Quick view of student-facing assistance and grading queues.
            </p>
          </article>

          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Labs</p>
            <h2 className="mt-2 text-lg font-semibold text-slate-900">Lab Readiness</h2>
            <p className="mt-2 text-sm text-slate-600">
              Current lab rollout status and pending checks for your sections.
            </p>
          </article>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Announcements</h2>
          <p className="mt-1 text-sm text-slate-600">
            TA-specific announcements and updates can be shown in this panel.
          </p>
        </section>
      </div>
    </div>
  );
}
