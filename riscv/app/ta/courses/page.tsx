'use client';

import Link from 'next/link';
import { FiBookOpen, FiClipboard, FiEye, FiLayers, FiMonitor } from 'react-icons/fi';
import { ins } from '@/components/instructor-shell';
import { useStaffCourseSummaries } from '@/components/use-staff-course-summaries';

const COURSE_ACTIONS = [
  {
    label: 'View Roster',
    buildHref: (courseId: string) =>
      `/ta/courses/roster?course_id=${encodeURIComponent(courseId)}`,
    icon: FiBookOpen,
  },
  {
    label: 'View Lab Submissions',
    buildHref: (courseId: string) =>
      `/ta/courses/submissions?course_id=${encodeURIComponent(courseId)}`,
    icon: FiLayers,
  },
  {
    label: 'View Lab Grades',
    buildHref: (courseId: string) =>
      `/ta/courses/grades?course_id=${encodeURIComponent(courseId)}`,
    icon: FiClipboard,
  },
  {
    label: 'Review Lab Submissions',
    buildHref: (courseId: string) =>
      `/ta/student-labs-root?course_id=${encodeURIComponent(courseId)}`,
    icon: FiEye,
  },
] as const;

const courseActionClass =
  'inline-flex w-full items-center gap-3 rounded-[1.6rem] border border-amber-300 bg-white px-4 py-3.5 text-sm font-semibold text-stone-900 shadow-[0_10px_24px_rgba(180,120,20,0.12)] transition hover:-translate-y-px hover:border-amber-400 hover:bg-orange-50/80 hover:shadow-[0_14px_30px_rgba(180,120,20,0.16)]';

export default function TACoursesPage() {
  const { summaries, loading, message } = useStaffCourseSummaries();

  const totalStudents = summaries.reduce((sum, summary) => sum + summary.studentCount, 0);
  const totalLabs = summaries.reduce((sum, summary) => sum + summary.labCount, 0);

  return (
    <div className={ins.pageWrapWide}>
      <Link href="/ta" className={ins.backLink}>
        ← Back to dashboard
      </Link>

      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className={ins.kicker}>Teaching Assistant</p>
          <h1 className={`${ins.h1} mt-2`}>Assigned courses</h1>
          <p className={ins.subtitle}>
            The same workbench flow as the dashboard, with all of your assigned courses in one
            place.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/ta/simulator" className={`${ins.btnNeutral} gap-2 px-4 py-2.5`}>
            <FiMonitor className="h-4 w-4" aria-hidden />
            Open sandbox
          </Link>
        </div>
      </header>

      {message && <div className={ins.msgErr}>{message}</div>}

      {loading ? (
        <div className={`${ins.card} ${ins.cardPad} flex flex-col items-center py-12`}>
          <div className={ins.spinner} />
          <p className="mt-4 text-sm text-stone-600">Loading assigned courses...</p>
        </div>
      ) : summaries.length === 0 ? (
        <div className={`${ins.card} ${ins.cardPad}`}>
          <h2 className={ins.h2Card}>No assigned courses</h2>
          <p className="mt-2 text-sm text-stone-600">
            You do not currently have any active TA course assignments.
          </p>
        </div>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <article className={`${ins.card} ${ins.cardPad}`}>
              <p className={ins.labelCaps}>Assigned courses</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-stone-900">
                {summaries.length}
              </p>
              <p className="mt-2 text-sm text-stone-600">
                Sections where you can review work and grading.
              </p>
            </article>

            <article className={`${ins.card} ${ins.cardPad}`}>
              <p className={ins.labelCaps}>Students</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-stone-900">
                {totalStudents}
              </p>
              <p className="mt-2 text-sm text-stone-600">
                Active student memberships across your assigned rosters.
              </p>
            </article>

            <article className={`${ins.card} ${ins.cardPad}`}>
              <p className={ins.labelCaps}>Course labs</p>
              <p className="mt-3 text-3xl font-bold tracking-tight text-stone-900">
                {totalLabs}
              </p>
              <p className="mt-2 text-sm text-stone-600">
                Labs currently assigned to your courses.
              </p>
            </article>
          </section>

          <section className="grid gap-5 lg:grid-cols-2">
            {summaries.map((summary) => (
              <article key={summary.course.course_id} className={`${ins.card} ${ins.cardPad}`}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className={ins.h2Card}>{summary.course.code}</h2>
                      <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900">
                        {summary.course.course_id}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-stone-700">{summary.course.title}</p>
                    {summary.course.term && (
                      <p className="mt-1 text-xs uppercase tracking-wide text-stone-500">
                        {summary.course.term}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-xl border border-amber-100 bg-orange-50/70 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                        Students
                      </p>
                      <p className="mt-1 text-xl font-bold text-stone-900">
                        {summary.studentCount}
                      </p>
                    </div>
                    <div className="rounded-xl border border-amber-100 bg-orange-50/70 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                        Staff
                      </p>
                      <p className="mt-1 text-xl font-bold text-stone-900">
                        {summary.staffCount}
                      </p>
                    </div>
                    <div className="rounded-xl border border-amber-100 bg-orange-50/70 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                        Labs
                      </p>
                      <p className="mt-1 text-xl font-bold text-stone-900">
                        {summary.labCount}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {COURSE_ACTIONS.map((action) => {
                    const Icon = action.icon;

                    return (
                      <Link
                        key={action.label}
                        href={action.buildHref(summary.course.course_id)}
                        className={courseActionClass}
                      >
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-200 bg-orange-50 text-amber-800 shadow-sm">
                          <Icon className="h-5 w-5" aria-hidden />
                        </span>
                        <span>{action.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </article>
            ))}
          </section>
        </>
      )}
    </div>
  );
}
