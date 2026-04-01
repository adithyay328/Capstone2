"use client";

import Link from "next/link";
import { useState } from "react";
import { updateCourseRole } from "./api/frontend";
import type {
  CourseMembershipRole,
  ManageRoleMembership,
} from "./api/types";

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
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl p-8 space-y-6">
        <div className="flex flex-col gap-2">
          <Link
            href="/instructor"
            className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Back to dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Manage Roles</h1>
          <p className="text-sm text-slate-600">
            Change course membership roles for TA and student accounts.
          </p>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-600">
            This tool updates <code>course_memberships.role</code> for a single user in a single
            course. Instructor accounts are not editable from this page.
          </p>
        </section>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="Enter username"
                required
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="courseId" className="block text-sm font-medium text-slate-700">
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
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-700">
                New Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(event) => setRole(event.target.value as CourseMembershipRole)}
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {isSubmitting ? "Updating..." : "Update role"}
            </button>
            {message && (
              <span
                className={`text-sm ${
                  message.success ? "text-emerald-700" : "text-red-700"
                }`}
              >
                {message.text}
              </span>
            )}
          </div>
        </form>

        {lastChange && (
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Last Change</h2>
            <p className="mt-2 text-sm text-slate-700">
              <span className="font-medium">{lastChange.username}</span> is now{" "}
              <span className="font-medium uppercase">{lastChange.role}</span> in course{" "}
              <span className="font-medium">{lastChange.courseId}</span>.
            </p>
            {lastChange.previousRole && (
              <p className="mt-1 text-sm text-slate-600">
                Previous role: <span className="font-medium">{lastChange.previousRole}</span>
              </p>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
