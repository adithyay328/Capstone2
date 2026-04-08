"use client";

import Link from "next/link";
import { useState } from "react";
import { updateCourseRole } from "./api/frontend";
import type { CourseMembershipRole, ManageRoleMembership } from "./api/types";
import { ins } from "@/components/instructor-shell";

const roleOptions: { value: CourseMembershipRole; label: string }[] = [
  { value: "student", label: "Student" },
  { value: "ta", label: "TA" },
];

export default function ManageRolesPage() {
  const [username, setUsername] = useState("");
  const [courseId, setCourseId] = useState("");
  const [role, setRole] = useState<CourseMembershipRole>("student");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [lastChange, setLastChange] = useState<ManageRoleMembership | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const response = await updateCourseRole({
        username,
        courseId,
        role,
      });

      setMessage({
        success: response.success,
        text: response.message,
      });

      if (response.success && response.membership) {
        setLastChange(response.membership);
      }
    } catch (error) {
      setMessage({
        success: false,
        text: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={ins.pageWrapMd}>
      <div className="flex flex-col gap-2">
        <Link href="/instructor" className={ins.backLink}>
          Back to dashboard
        </Link>
        <h1 className={ins.h1}>Manage Roles</h1>
        <p className={ins.subtitle}>
          Change course membership roles for TA and student accounts.
        </p>
      </div>

      <section className={`${ins.card} ${ins.cardPad} mt-6`}>
        <p className="text-sm text-stone-700">
          This tool updates{" "}
          <code className="rounded bg-stone-900 px-1.5 py-0.5 text-amber-200/90">
            course_memberships.role
          </code>{" "}
          for a single user in a single course. Instructor accounts are not editable from this page.
        </p>
      </section>

      <form onSubmit={handleSubmit} className={`${ins.card} ${ins.cardPad} mt-6 space-y-4`}>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label htmlFor="username" className={ins.label}>
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter username"
              required
              className={ins.input}
            />
          </div>

          <div>
            <label htmlFor="courseId" className={ins.label}>
              Course ID
            </label>
            <input
              id="courseId"
              type="text"
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              placeholder="5-digit course ID"
              required
              pattern="[0-9]{5}"
              maxLength={5}
              className={ins.input}
            />
          </div>

          <div>
            <label htmlFor="role" className={ins.label}>
              New Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(event) => setRole(event.target.value as CourseMembershipRole)}
              className={ins.select}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={isSubmitting} className={ins.btnPrimary}>
            {isSubmitting ? "Updating..." : "Update role"}
          </button>
          {message && (
            <span
              className={`text-sm font-medium ${
                message.success ? "text-emerald-300" : "text-red-300"
              }`}
            >
              {message.text}
            </span>
          )}
        </div>
      </form>

      {lastChange && (
        <section className={`${ins.card} ${ins.cardPad} mt-6`}>
          <h2 className={ins.h2Card}>Last Change</h2>
          <p className="mt-2 text-sm text-stone-200">
            <span className="font-semibold text-stone-900">{lastChange.username}</span> is now{" "}
            <span className="font-semibold uppercase text-amber-300">{lastChange.role}</span> in course{" "}
            <span className="font-semibold text-stone-900">{lastChange.courseId}</span>.
          </p>
          {lastChange.previousRole && (
            <p className="mt-1 text-sm text-stone-600">
              Previous role: <span className="font-medium text-stone-200">{lastChange.previousRole}</span>
            </p>
          )}
        </section>
      )}
    </div>
  );
}
