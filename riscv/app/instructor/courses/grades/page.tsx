"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { CourseLab } from "@/app/api/course_labs/frontend";
import { getCourseLabs } from "@/app/api/course_labs/frontend";
import { getCourseMembers } from "@/app/api/course_members/frontend";
import type { CourseMember } from "@/app/api/course_members/types";
import type { LabGradesSummaryResponse } from "@/app/api/lab_grades_summary/types";
import type { LabGradesAttemptsResponse } from "@/app/api/lab_grades_attempts/types";
import { ins } from "@/components/instructor-shell";

function csvEscape(v: unknown) {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function downloadCsv(filename: string, headers: string[], rows: Array<Array<unknown>>) {
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((r) => r.map(csvEscape).join(",")),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function CourseLabGradesContent() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("course_id") ?? "";
  const labUidFromQuery = searchParams.get("lab_uid") ?? "";

  const [courseLabs, setCourseLabs] = useState<CourseLab[]>([]);
  const [members, setMembers] = useState<CourseMember[]>([]);

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);

  const [selectedLabUid, setSelectedLabUid] = useState<string>("");

  const [gradesSummary, setGradesSummary] = useState<LabGradesSummaryResponse | null>(null);
  const [gradesLoading, setGradesLoading] = useState(false);

  const [selectedStudentUsername, setSelectedStudentUsername] = useState<string>("");

  const membersInCourse = useMemo(
    () => (members ?? []).filter((m) => m.role === "student" || m.role === "ta"),
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

        const [labsRes, membersRes] = await Promise.all([
          getCourseLabs(courseId),
          getCourseMembers(courseId),
        ]);

        if (cancelled) return;

        const labs = (labsRes.success && labsRes.labs ? labsRes.labs : []) as CourseLab[];
        const membs = (membersRes.success && membersRes.members ? membersRes.members : []) as CourseMember[];

        setCourseLabs(labs);
        setMembers(membs);

        const lab0 =
          labs.find((l) => l.lab_uid === "lab0-intro-addition") ??
          labs.find((l) => l.title.toLowerCase().includes("lab 0") || l.title.toLowerCase().includes("addition"));
        const firstLab = lab0 ?? labs[0];

        const desiredLabUid =
          labUidFromQuery && labs.some((l) => l.lab_uid === labUidFromQuery)
            ? labUidFromQuery
            : firstLab?.lab_uid ?? "";

        setSelectedLabUid(desiredLabUid);
        const filtered = membs.filter((m) => m.role === "student" || m.role === "ta");
        if (filtered.length > 0) setSelectedStudentUsername(filtered[0].username);
      } catch (err) {
        if (cancelled) return;
        setMessage({ success: false, text: err instanceof Error ? err.message : "Failed to load" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [courseId, labUidFromQuery]);

  useEffect(() => {
    if (!courseId || !/^[0-9]{5}$/.test(courseId)) return;
    if (!selectedLabUid) return;

    let cancelled = false;

    (async () => {
      try {
        setGradesLoading(true);
        const res = await fetch(
          `/api/lab_grades_summary?course_id=${encodeURIComponent(courseId)}&lab_uid=${encodeURIComponent(selectedLabUid)}`
        );
        const data = (await res.json()) as LabGradesSummaryResponse;
        if (cancelled) return;
        if (!res.ok || !data.success) {
          setMessage({ success: false, text: data.message ?? "Failed to load grades summary" });
          setGradesSummary(null);
          return;
        }
        setGradesSummary(data);
        setMessage(null);
      } catch (err) {
        if (cancelled) return;
        setMessage({ success: false, text: err instanceof Error ? err.message : "Failed to load grades" });
      } finally {
        if (!cancelled) setGradesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [courseId, selectedLabUid]);

  const handleDownloadClassFinalGrades = () => {
    if (!gradesSummary?.members) return;
    const headers = ["username", "role", "attemptsUsed", "bestScore", "maxScore"];
    const rows = gradesSummary.members.map((m) => [
      m.username,
      m.role,
      m.attemptsUsed,
      m.bestScore ?? "",
      gradesSummary.maxScore,
    ]);
    downloadCsv(`lab_grades_${courseId}_${selectedLabUid}.csv`, headers, rows);
  };

  const handleDownloadStudentAttempts = async (username: string) => {
    try {
      const res = await fetch(
        `/api/lab_grades_attempts?course_id=${encodeURIComponent(courseId)}&lab_uid=${encodeURIComponent(
          selectedLabUid
        )}&username=${encodeURIComponent(username)}`
      );
      const data = (await res.json()) as LabGradesAttemptsResponse;
      if (!res.ok || !data.success) {
        setMessage({ success: false, text: data.message ?? "Failed to load attempts" });
        return;
      }
      const headers = ["attemptNumber", "gradeSessionId", "gradedAt", "passedTests", "score", "maxScore", "totalTests"];
      const rows = (data.attempts ?? []).map((a) => [
        a.attemptNumber,
        a.gradeSessionId,
        a.gradedAt,
        a.passedTests,
        a.score,
        a.maxScore,
        a.totalTests,
      ]);
      downloadCsv(`lab_attempts_${courseId}_${selectedLabUid}_${username}.csv`, headers, rows);
      setMessage({ success: true, text: "Downloaded attempts CSV." });
    } catch (err) {
      setMessage({ success: false, text: err instanceof Error ? err.message : "Download failed" });
    }
  };

  const handleDownloadClassAttempts = async () => {
    if (!selectedLabUid) return;
    const students = membersInCourse;
    if (students.length === 0) return;

    setMessage(null);
    try {
      const allRows: Array<Array<unknown>> = [];

      for (const s of students) {
        const res = await fetch(
          `/api/lab_grades_attempts?course_id=${encodeURIComponent(courseId)}&lab_uid=${encodeURIComponent(
            selectedLabUid
          )}&username=${encodeURIComponent(s.username)}`
        );
        const data = (await res.json()) as LabGradesAttemptsResponse;
        if (!res.ok || !data.success) {
          throw new Error(data.message ?? `Failed to load attempts for ${s.username}`);
        }

        for (const a of data.attempts ?? []) {
          allRows.push([
            s.username,
            a.attemptNumber,
            a.gradeSessionId,
            a.gradedAt,
            a.passedTests,
            a.score,
            a.maxScore,
            a.totalTests,
          ]);
        }
      }

      const headers = [
        "studentUsername",
        "attemptNumber",
        "gradeSessionId",
        "gradedAt",
        "passedTests",
        "score",
        "maxScore",
        "totalTests",
      ];
      downloadCsv(`lab_attempts_class_${courseId}_${selectedLabUid}.csv`, headers, allRows);
      setMessage({ success: true, text: "Downloaded class attempts CSV." });
    } catch (err) {
      setMessage({ success: false, text: err instanceof Error ? err.message : "Download failed" });
    }
  };

  const inCourseLabs = courseLabs;

  if (!courseId || !/^[0-9]{5}$/.test(courseId)) {
    return (
      <div className={ins.pageWrapMd}>
        <Link href="/instructor/courses" className={ins.backLink}>
          ← Back to courses
        </Link>
        <p className="mt-4 text-stone-600">Invalid course.</p>
      </div>
    );
  }

  return (
    <div className={ins.pageWrapMd}>
      <Link href="/instructor/courses" className={ins.backLink}>
        ← Back to courses
      </Link>
      <h1 className={`${ins.h1} mt-4`}>Lab Grades</h1>

      {message && (
        <div className={`mt-4 ${message.success ? ins.msgOk : ins.msgErr}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <p className="mt-6 text-stone-600">Loading...</p>
      ) : (
        <>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-[12rem] flex-1">
              <label className={ins.label}>Lab</label>
              <select
                value={selectedLabUid}
                onChange={(e) => setSelectedLabUid(e.target.value)}
                className={ins.select}
                disabled={gradesLoading}
              >
                {inCourseLabs.map((l) => (
                  <option key={l.lab_uid} value={l.lab_uid}>
                    {l.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleDownloadClassFinalGrades}
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
                {gradesLoading ? "Loading..." : gradesSummary ? `Max score: ${gradesSummary.maxScore}` : ""}
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
                    {gradesSummary.members?.map((m) => (
                      <tr key={m.username}>
                        <td className={`${ins.tableCell} font-medium text-stone-900`}>{m.username}</td>
                        <td className={ins.tableCell}>{m.role}</td>
                        <td className={ins.tableCell}>{m.attemptsUsed}</td>
                        <td className={`${ins.tableCell} text-stone-800`}>{m.bestScore === null ? "—" : m.bestScore}</td>
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
                  onChange={(e) => setSelectedStudentUsername(e.target.value)}
                  className={ins.select}
                  disabled={gradesLoading}
                >
                  {membersInCourse.map((m) => (
                    <option key={m.username} value={m.username}>
                      {m.username} ({m.role})
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

export default function CourseLabGradesPage() {
  return (
    <Suspense
      fallback={
        <div className={`${ins.pageWrapMd} text-stone-600`}>
          <p>Loading...</p>
        </div>
      }
    >
      <CourseLabGradesContent />
    </Suspense>
  );
}
