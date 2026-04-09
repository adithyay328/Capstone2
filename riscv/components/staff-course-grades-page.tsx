"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { CourseLab } from "@/app/api/course_labs/frontend";
import { getCourseLabs } from "@/app/api/course_labs/frontend";
import { getCourseMembers } from "@/app/api/course_members/frontend";
import type { CourseMember } from "@/app/api/course_members/types";
import type { LabGradesAttemptsResponse } from "@/app/api/lab_grades_attempts/types";
import type { LabGradesSummaryResponse } from "@/app/api/lab_grades_summary/types";
import { ins } from "@/components/instructor-shell";

type StaffCourseGradesPageProps = {
  portal: "instructor" | "ta";
};

function csvEscape(value: unknown) {
  const normalized = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(normalized)) return `"${normalized.replace(/"/g, '""')}"`;
  return normalized;
}

function downloadCsv(
  filename: string,
  headers: string[],
  rows: Array<Array<unknown>>
) {
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function StaffCourseGradesContent({ portal }: StaffCourseGradesPageProps) {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("course_id") ?? "";
  const labUidFromQuery = searchParams.get("lab_uid") ?? "";
  const backHref = `/${portal}/courses`;

  const [courseLabs, setCourseLabs] = useState<CourseLab[]>([]);
  const [members, setMembers] = useState<CourseMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(
    null
  );
  const [selectedLabUid, setSelectedLabUid] = useState("");
  const [gradesSummary, setGradesSummary] = useState<LabGradesSummaryResponse | null>(
    null
  );
  const [gradesLoading, setGradesLoading] = useState(false);
  const [selectedStudentUsername, setSelectedStudentUsername] = useState("");

  const membersInCourse = useMemo(
    () => (members ?? []).filter((member) => member.role === "student"),
    [members]
  );

  useEffect(() => {
    if (!courseId || !/^[0-9]{5}$/.test(courseId)) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setMessage(null);

        const [labsResponse, membersResponse] = await Promise.all([
          getCourseLabs(courseId),
          getCourseMembers(courseId),
        ]);

        if (cancelled) return;

        const nextLabs = (labsResponse.success && labsResponse.labs
          ? labsResponse.labs
          : []) as CourseLab[];
        const nextMembers = (membersResponse.success && membersResponse.members
          ? membersResponse.members
          : []) as CourseMember[];

        setCourseLabs(nextLabs);
        setMembers(nextMembers);

        const defaultLab =
          nextLabs.find((lab) => lab.lab_uid === "lab0-intro-addition") ??
          nextLabs.find(
            (lab) =>
              lab.title.toLowerCase().includes("lab 0") ||
              lab.title.toLowerCase().includes("addition")
          ) ??
          nextLabs[0];

        const desiredLabUid =
          labUidFromQuery && nextLabs.some((lab) => lab.lab_uid === labUidFromQuery)
            ? labUidFromQuery
            : defaultLab?.lab_uid ?? "";

        setSelectedLabUid(desiredLabUid);

        const nextSelectableMembers = nextMembers.filter((member) => member.role === "student");
        if (nextSelectableMembers.length > 0) {
          setSelectedStudentUsername(nextSelectableMembers[0].username);
        } else {
          setSelectedStudentUsername("");
        }
      } catch (error) {
        if (cancelled) return;
        setMessage({
          success: false,
          text: error instanceof Error ? error.message : "Failed to load grade tools.",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [courseId, labUidFromQuery]);

  useEffect(() => {
    if (!courseId || !/^[0-9]{5}$/.test(courseId) || !selectedLabUid) return;

    let cancelled = false;

    (async () => {
      try {
        setGradesLoading(true);
        const response = await fetch(
          `/api/lab_grades_summary?course_id=${encodeURIComponent(courseId)}&lab_uid=${encodeURIComponent(selectedLabUid)}`
        );
        const data = (await response.json()) as LabGradesSummaryResponse;

        if (cancelled) return;

        if (!response.ok || !data.success) {
          setMessage({
            success: false,
            text: data.message ?? "Failed to load grades summary.",
          });
          setGradesSummary(null);
          return;
        }

        setGradesSummary(data);
        setMessage(null);
      } catch (error) {
        if (cancelled) return;
        setMessage({
          success: false,
          text: error instanceof Error ? error.message : "Failed to load grades.",
        });
      } finally {
        if (!cancelled) setGradesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [courseId, selectedLabUid]);

  const handleDownloadFinalGrades = () => {
    if (!gradesSummary?.members) return;

    downloadCsv(
      `lab_grades_${courseId}_${selectedLabUid}.csv`,
      ["username", "role", "attemptsUsed", "bestScore", "maxScore"],
      gradesSummary.members.map((member) => [
        member.username,
        member.role,
        member.attemptsUsed,
        member.bestScore ?? "",
        gradesSummary.maxScore,
      ])
    );
  };

  const handleDownloadStudentAttempts = async (username: string) => {
    try {
      const response = await fetch(
        `/api/lab_grades_attempts?course_id=${encodeURIComponent(courseId)}&lab_uid=${encodeURIComponent(selectedLabUid)}&username=${encodeURIComponent(username)}`
      );
      const data = (await response.json()) as LabGradesAttemptsResponse;

      if (!response.ok || !data.success) {
        setMessage({
          success: false,
          text: data.message ?? "Failed to load attempts.",
        });
        return;
      }

      downloadCsv(
        `lab_attempts_${courseId}_${selectedLabUid}_${username}.csv`,
        [
          "attemptNumber",
          "gradeSessionId",
          "gradedAt",
          "passedTests",
          "score",
          "maxScore",
          "totalTests",
        ],
        (data.attempts ?? []).map((attempt) => [
          attempt.attemptNumber,
          attempt.gradeSessionId,
          attempt.gradedAt,
          attempt.passedTests,
          attempt.score,
          attempt.maxScore,
          attempt.totalTests,
        ])
      );
      setMessage({ success: true, text: "Downloaded attempts CSV." });
    } catch (error) {
      setMessage({
        success: false,
        text: error instanceof Error ? error.message : "Download failed.",
      });
    }
  };

  const handleDownloadClassAttempts = async () => {
    if (!selectedLabUid || membersInCourse.length === 0) return;

    setMessage(null);

    try {
      const allRows: Array<Array<unknown>> = [];

      for (const member of membersInCourse) {
        const response = await fetch(
          `/api/lab_grades_attempts?course_id=${encodeURIComponent(courseId)}&lab_uid=${encodeURIComponent(selectedLabUid)}&username=${encodeURIComponent(member.username)}`
        );
        const data = (await response.json()) as LabGradesAttemptsResponse;

        if (!response.ok || !data.success) {
          throw new Error(data.message ?? `Failed to load attempts for ${member.username}`);
        }

        for (const attempt of data.attempts ?? []) {
          allRows.push([
            member.username,
            attempt.attemptNumber,
            attempt.gradeSessionId,
            attempt.gradedAt,
            attempt.passedTests,
            attempt.score,
            attempt.maxScore,
            attempt.totalTests,
          ]);
        }
      }

      downloadCsv(
        `lab_attempts_class_${courseId}_${selectedLabUid}.csv`,
        [
          "studentUsername",
          "attemptNumber",
          "gradeSessionId",
          "gradedAt",
          "passedTests",
          "score",
          "maxScore",
          "totalTests",
        ],
        allRows
      );
      setMessage({ success: true, text: "Downloaded class attempts CSV." });
    } catch (error) {
      setMessage({
        success: false,
        text: error instanceof Error ? error.message : "Download failed.",
      });
    }
  };

  if (!courseId || !/^[0-9]{5}$/.test(courseId)) {
    return (
      <div className={ins.pageWrapMd}>
        <Link href={backHref} className={ins.backLink}>
          ← Back to courses
        </Link>
        <p className="mt-4 text-stone-600">Invalid course.</p>
      </div>
    );
  }

  return (
    <div className={ins.pageWrapMd}>
      <Link href={backHref} className={ins.backLink}>
        ← Back to courses
      </Link>
      <div className="mt-4">
        <p className={ins.kicker}>Course Grades</p>
        <h1 className={`${ins.h1} mt-2`}>Lab grades and attempts</h1>
        <p className={ins.subtitle}>
          Review best scores for the selected lab and export attempt history without changing course setup.
        </p>
      </div>

      {message && (
        <div className={`mt-4 ${message.success ? ins.msgOk : ins.msgErr}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className={`${ins.card} ${ins.cardPad} mt-6 flex flex-col items-center py-12`}>
          <div className={ins.spinner} />
          <p className="mt-4 text-sm text-stone-600">Loading grade tools...</p>
        </div>
      ) : (
        <>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-[12rem] flex-1">
              <label className={ins.label}>Lab</label>
              <select
                value={selectedLabUid}
                onChange={(event) => setSelectedLabUid(event.target.value)}
                className={ins.select}
                disabled={gradesLoading}
              >
                {courseLabs.map((lab) => (
                  <option key={lab.lab_uid} value={lab.lab_uid}>
                    {lab.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadFinalGrades}
                disabled={!gradesSummary?.members?.length}
                className={ins.btnPrimary}
              >
                Download final grades (CSV)
              </button>
            </div>
          </div>

          <div className={`${ins.card} mt-6 overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <h2 className={ins.h2Card}>Final scores</h2>
              <div className="text-sm text-stone-600">
                {gradesLoading
                  ? "Loading..."
                  : gradesSummary
                    ? `Max score: ${gradesSummary.maxScore}`
                    : ""}
              </div>
            </div>

            <div className="p-4">
              {gradesLoading || !gradesSummary ? (
                <p className="text-stone-600">Loading grades...</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`${ins.tableHead} text-left`}>
                      <th className={`${ins.tableCell} font-semibold text-stone-900`}>Username</th>
                      <th className={`${ins.tableCell} font-semibold text-stone-900`}>Role</th>
                      <th className={`${ins.tableCell} font-semibold text-stone-900`}>Attempts Used</th>
                      <th className={`${ins.tableCell} font-semibold text-stone-900`}>Best Score</th>
                    </tr>
                  </thead>
                  <tbody className={ins.divideList}>
                    {gradesSummary.members?.map((member) => (
                      <tr key={member.username}>
                        <td className={`${ins.tableCell} font-medium text-stone-900`}>
                          {member.username}
                        </td>
                        <td className={ins.tableCell}>{member.role}</td>
                        <td className={ins.tableCell}>{member.attemptsUsed}</td>
                        <td className={`${ins.tableCell} text-stone-800`}>
                          {member.bestScore === null ? "—" : member.bestScore}
                        </td>
                      </tr>
                    ))}
                    {(!gradesSummary.members || gradesSummary.members.length === 0) && (
                      <tr>
                        <td colSpan={4} className={`${ins.tableCell} text-stone-700`}>
                          No members found for this course.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className={`${ins.card} ${ins.cardPad} mt-8`}>
            <h2 className={ins.h2Card}>Attempts history (download)</h2>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="w-full sm:w-[22rem]">
                <label className={ins.label}>Student</label>
                <select
                  value={selectedStudentUsername}
                  onChange={(event) => setSelectedStudentUsername(event.target.value)}
                  className={ins.select}
                  disabled={gradesLoading}
                >
                  {membersInCourse.map((member) => (
                    <option key={member.username} value={member.username}>
                      {member.username} ({member.role})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleDownloadClassAttempts()}
                  disabled={gradesLoading || membersInCourse.length === 0}
                  className={ins.btnPrimary}
                  title="Download attempts history for every student in this course"
                >
                  Download class attempts CSV
                </button>
                <button
                  type="button"
                  onClick={() => void handleDownloadStudentAttempts(selectedStudentUsername)}
                  disabled={!selectedStudentUsername}
                  className={ins.btnSecondary}
                >
                  Download attempts history (CSV)
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function StaffCourseGradesPage(props: StaffCourseGradesPageProps) {
  return (
    <Suspense
      fallback={
        <div className={`${ins.pageWrapMd} text-stone-600`}>
          <p>Loading...</p>
        </div>
      }
    >
      <StaffCourseGradesContent {...props} />
    </Suspense>
  );
}
