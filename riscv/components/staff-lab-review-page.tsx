"use client";

import React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { listCourses } from "@/app/api/list_courses/frontend";
import { getCourseMembers } from "@/app/api/course_members/frontend";
import { getCourseLabs, type CourseLab } from "@/app/api/course_labs/frontend";
import type { Course } from "@/app/api/list_courses/types";
import type { CourseMember } from "@/app/api/course_members/types";
import LabRoot from "./lab_root";

type StaffLabReviewPageProps = {
  portal: "instructor" | "ta";
};

export default function StaffLabReviewPage({
  portal,
}: StaffLabReviewPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("course_id") ?? "";
  const studentUsername = searchParams.get("student_username") ?? "";
  const labUid = searchParams.get("lab") ?? "";
  const basePath = `/${portal}/student-labs-root`;

  const [courses, setCourses] = React.useState<Course[]>([]);
  const [members, setMembers] = React.useState<CourseMember[]>([]);
  const [labs, setLabs] = React.useState<CourseLab[]>([]);
  const [coursesLoading, setCoursesLoading] = React.useState(true);
  const [detailsLoading, setDetailsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function loadCourses() {
      setCoursesLoading(true);
      const response = await listCourses();
      if (cancelled) return;

      if (!response.success || !response.courses) {
        setError(response.message ?? "Unable to load courses.");
        setCourses([]);
        setCoursesLoading(false);
        return;
      }

      setCourses(response.courses);
      setCoursesLoading(false);
    }

    void loadCourses();
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (!courseId) {
      setMembers([]);
      setLabs([]);
      return;
    }

    let cancelled = false;

    async function loadCourseDetails() {
      setDetailsLoading(true);
      setError(null);

      const [membersResponse, labsResponse] = await Promise.all([
        getCourseMembers(courseId),
        getCourseLabs(courseId),
      ]);

      if (cancelled) return;

      if (!membersResponse.success) {
        setError(membersResponse.message ?? "Unable to load course members.");
        setMembers([]);
      } else {
        setMembers(membersResponse.members ?? []);
      }

      if (!labsResponse.success) {
        setError(labsResponse.message ?? "Unable to load course labs.");
        setLabs([]);
      } else {
        setLabs(labsResponse.labs ?? []);
      }

      setDetailsLoading(false);
    }

    void loadCourseDetails();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const activeStudents = React.useMemo(
    () =>
      members.filter(
        (member) =>
          member.role === "student" &&
          (typeof member.status === "undefined" || member.status === "active")
      ),
    [members]
  );

  const selectedCourse = React.useMemo(
    () => courses.find((course) => course.course_id === courseId) ?? null,
    [courseId, courses]
  );

  const updateParams = React.useCallback(
    (nextValues: { course_id?: string; student_username?: string; lab?: string }) => {
      const params = new URLSearchParams(searchParams.toString());

      if (typeof nextValues.course_id !== "undefined") {
        if (nextValues.course_id) params.set("course_id", nextValues.course_id);
        else params.delete("course_id");
      }

      if (typeof nextValues.student_username !== "undefined") {
        if (nextValues.student_username) {
          params.set("student_username", nextValues.student_username);
        } else {
          params.delete("student_username");
        }
      }

      if (typeof nextValues.lab !== "undefined") {
        if (nextValues.lab) params.set("lab", nextValues.lab);
        else params.delete("lab");
      }

      const query = params.toString();
      router.replace(query ? `${basePath}?${query}` : basePath);
    },
    [basePath, router, searchParams]
  );

  if (courseId && studentUsername && labUid) {
    return <LabRoot />;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl p-8">
        <Link
          href={portal === "instructor" ? "/instructor" : "/ta"}
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Back to Dashboard
        </Link>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            {portal === "instructor" ? "Instructor" : "Teaching Assistant"}
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            Student Lab Review
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Choose a course, student, and lab to open the reused lab workspace and inspect past submissions.
          </p>

          {error && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Course
              <select
                value={courseId}
                onChange={(event) =>
                  updateParams({
                    course_id: event.target.value,
                    student_username: "",
                    lab: "",
                  })
                }
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                disabled={coursesLoading}
              >
                <option value="">Select a course</option>
                {courses.map((course) => (
                  <option key={course.course_id} value={course.course_id}>
                    {course.code} - {course.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Student
              <select
                value={studentUsername}
                onChange={(event) =>
                  updateParams({
                    student_username: event.target.value,
                    lab: "",
                  })
                }
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                disabled={!courseId || detailsLoading}
              >
                <option value="">Select a student</option>
                {activeStudents.map((student) => (
                  <option key={student.username} value={student.username}>
                    {student.username}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
              Lab
              <select
                value={labUid}
                onChange={(event) => updateParams({ lab: event.target.value })}
                className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                disabled={!courseId || !studentUsername || detailsLoading}
              >
                <option value="">Select a lab</option>
                {labs.map((lab) => (
                  <option key={lab.lab_uid} value={lab.lab_uid}>
                    {lab.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {coursesLoading
              ? "Loading courses..."
              : detailsLoading
                ? "Loading students and labs for the selected course..."
                : selectedCourse
                  ? `Selected course: ${selectedCourse.code} - ${selectedCourse.title}`
                  : "Start by selecting a course."}
          </div>
        </div>
      </div>
    </div>
  );
}
