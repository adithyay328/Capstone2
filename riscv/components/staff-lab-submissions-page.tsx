'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { listCourses } from '@/app/api/list_courses/frontend';
import { getCourseLabSubmissionsOverview } from '@/app/api/course_lab_submissions_overview/frontend';
import type { Course } from '@/app/api/list_courses/types';
import type { LabSubmission } from '@/app/api/lab_submissions/types';
import type { StudentSubmissionOverview } from '@/app/api/course_lab_submissions_overview/types';

type StaffLabSubmissionsPageProps = {
  portal: 'instructor' | 'ta';
};

export default function StaffLabSubmissionsPage({
  portal,
}: StaffLabSubmissionsPageProps) {
  const searchParams = useSearchParams();
  const courseId = searchParams.get('course_id') ?? '';
  const labUid = searchParams.get('lab_uid') ?? '';
  const [course, setCourse] = React.useState<Course | null>(null);
  const [labTitle, setLabTitle] = React.useState('');
  const [students, setStudents] = React.useState<StudentSubmissionOverview[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = React.useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = React.useState<LabSubmission | null>(null);
  const backHref = `/${portal}/courses/labs?course_id=${encodeURIComponent(courseId)}`;
  const reviewHrefBase = `/${portal}/student-labs-root`;
  const csvHref = `/api/course_lab_grades_csv?course_id=${encodeURIComponent(courseId)}&lab_uid=${encodeURIComponent(labUid)}`;

  React.useEffect(() => {
    if (!courseId || !labUid) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const [coursesResponse, overviewResponse] = await Promise.all([
        listCourses(),
        getCourseLabSubmissionsOverview(courseId, labUid),
      ]);

      if (cancelled) return;

      if (coursesResponse.success && coursesResponse.courses) {
        setCourse(
          coursesResponse.courses.find((entry) => entry.course_id === courseId) ?? null
        );
      }

      if (!overviewResponse.success) {
        setError(overviewResponse.message ?? 'Unable to load lab submissions.');
        setStudents([]);
        setLabTitle('');
        setSelectedStudent(null);
        setSelectedSubmission(null);
        setLoading(false);
        return;
      }

      const nextStudents = overviewResponse.students ?? [];
      setStudents(nextStudents);
      setLabTitle(overviewResponse.labTitle ?? '');
      setSelectedStudent(nextStudents[0]?.username ?? null);
      setSelectedSubmission(nextStudents[0]?.submissions[0] ?? null);
      setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [courseId, labUid]);

  const openSubmission = React.useCallback(
    (studentUsername: string, submission: LabSubmission) => {
      setSelectedStudent(studentUsername);
      setSelectedSubmission(submission);
    },
    []
  );

  if (!courseId || !labUid) {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <Link href={`/${portal}/courses`} className="text-sm font-semibold text-indigo-600">
          Back to courses
        </Link>
        <p className="mt-4 text-slate-600">Missing course or lab selection.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Link href={backHref} className="text-sm font-semibold text-indigo-600 hover:text-indigo-700">
              Back to course labs
            </Link>
            <h1 className="mt-4 text-2xl font-bold text-slate-900">Lab Submissions</h1>
            {course && (
              <p className="mt-1 text-sm text-slate-600">
                {course.code} - {course.title}
              </p>
            )}
            {labTitle && <p className="text-sm text-slate-500">Lab: {labTitle}</p>}
          </div>
          <a
            href={csvHref}
            className="inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Download Grades CSV
          </a>
        </div>

        {loading ? (
          <p className="mt-6 text-slate-500">Loading submissions...</p>
        ) : error ? (
          <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : (
          <>
            <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="grid grid-cols-[minmax(12rem,1fr)_10rem_minmax(22rem,2fr)] border-b border-slate-200 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>Student</span>
                <span>Total</span>
                <span>Recent submissions</span>
              </div>
              {students.length === 0 ? (
                <div className="px-4 py-6 text-sm text-slate-500">
                  No active students are enrolled in this course.
                </div>
              ) : (
                <div className="divide-y divide-slate-200">
                  {students.map((student) => (
                    <div
                      key={student.username}
                      className="grid grid-cols-[minmax(12rem,1fr)_10rem_minmax(22rem,2fr)] items-center gap-4 px-4 py-3"
                    >
                      <div>
                        <div className="font-medium text-slate-900">{student.username}</div>
                        <Link
                          href={`${reviewHrefBase}?course_id=${encodeURIComponent(courseId)}&student_username=${encodeURIComponent(student.username)}&lab=${encodeURIComponent(labUid)}`}
                          className="mt-1 inline-flex text-sm text-indigo-600 hover:text-indigo-700"
                        >
                          Open lab review
                        </Link>
                      </div>
                      <div className="text-sm text-slate-600">{student.totalSubmissions}</div>
                      <div className="flex flex-wrap gap-2">
                        {student.submissions.length === 0 ? (
                          <span className="text-sm text-slate-400">No submissions yet</span>
                        ) : (
                          <>
                            {student.submissions.map((submission, index) => {
                              const isActive =
                                selectedStudent === student.username &&
                                selectedSubmission?.gradeSessionId === submission.gradeSessionId;
                              return (
                                <button
                                  key={submission.gradeSessionId}
                                  type="button"
                                  onClick={() => openSubmission(student.username, submission)}
                                  className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                                    isActive
                                      ? 'bg-indigo-600 text-white'
                                      : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                                  }`}
                                >
                                  Attempt {index + 1}
                                </button>
                              );
                            })}
                            {student.totalSubmissions > student.submissions.length && (
                              <span className="self-center text-xs text-slate-400">
                                Showing latest {student.submissions.length} of {student.totalSubmissions}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              {selectedSubmission && selectedStudent ? (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {selectedStudent} submission
                    </h2>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                      Grade {selectedSubmission.grade.toFixed(2)}%
                    </span>
                    <span className="text-sm text-slate-800">
                      {selectedSubmission.passedTests}/{selectedSubmission.totalTests} tests passed
                    </span>
                    <span className="text-sm text-slate-700">
                      {new Date(selectedSubmission.submittedAt).toLocaleString()}
                    </span>
                  </div>
                  {selectedSubmission.errorMessage && (
                    <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      {selectedSubmission.errorMessage}
                    </div>
                  )}
                  <pre className="mt-4 max-h-[32rem] overflow-auto rounded-lg bg-slate-950 p-4 text-sm text-slate-300">
                    {selectedSubmission.submittedCode}
                  </pre>
                </>
              ) : (
                <div className="text-sm text-slate-500">
                  Choose a submission button from a student row to inspect the code.
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
