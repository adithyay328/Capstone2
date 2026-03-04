"use client";

import { useState } from "react";
import Link from "next/link";
import { searchUsers } from "./api/frontend";
import type { UserSearchResult } from "./api/types";

type RoleFilter = "any" | "student" | "instructor" | "ta";

const roleOptions: { value: RoleFilter; label: string }[] = [
  { value: "any", label: "Any role" },
  { value: "student", label: "Student" },
  { value: "instructor", label: "Instructor" },
  { value: "ta", label: "TA" },
];

const formatRole = (role?: string | null) => {
  if (!role) return "Unassigned";
  const normalized = role.toLowerCase();
  if (normalized === "instructor") return "Instructor";
  if (normalized === "student") return "Student";
  if (normalized === "ta") return "TA";
  return role;
};

export default function UserSearchPage() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<RoleFilter>("any");
  const [course, setCourse] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSearching(true);
    setHasSearched(true);
    setMessage(null);

    try {
      const response = await searchUsers({
        query,
        role,
        course,
      });

      if (response.success && response.users) {
        setResults(response.users);
        if (response.users.length === 0) {
          setMessage("No users matched this search.");
        }
      } else {
        setResults([]);
        setMessage(response.message ?? "Unable to search users.");
      }
    } catch (error) {
      setResults([]);
      setMessage(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setIsSearching(false);
    }
  };

  const showCourseRole = course.trim().length > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-5xl p-8 space-y-6">
        <div className="flex flex-col gap-2">
          <Link
            href="/instructor"
            className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Back to dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">User Search</h1>
          <p className="text-sm text-slate-600">
            Search registered users and filter by role or course. Results appear only after you press Search.
          </p>
        </div>

        <form
          onSubmit={handleSearch}
          className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="query" className="block text-sm font-medium text-slate-700">
                Username
              </label>
              <input
                id="query"
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by username"
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-slate-700">
                Role
              </label>
              <select
                id="role"
                value={role}
                onChange={(event) => setRole(event.target.value as RoleFilter)}
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {roleOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="course" className="block text-sm font-medium text-slate-700">
                Course
              </label>
              <input
                id="course"
                type="text"
                value={course}
                onChange={(event) => setCourse(event.target.value)}
                placeholder="Course ID or code"
                className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              type="submit"
              disabled={isSearching}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              {isSearching ? "Searching..." : "Search"}
            </button>
            {message && (
              <span className="text-sm text-slate-600">{message}</span>
            )}
          </div>
        </form>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Results</h2>
          {!hasSearched && (
            <p className="mt-2 text-sm text-slate-500">
              Run a search to load user results.
            </p>
          )}

          {hasSearched && results.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-slate-200 text-slate-500">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Username</th>
                    <th className="py-2 pr-4 font-medium">ASU ID</th>
                    <th className="py-2 pr-4 font-medium">Role</th>
                    <th className="py-2 pr-4 font-medium">Course</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {results.map((user) => {
                    const roleLabel = showCourseRole
                      ? formatRole(user.courseRole)
                      : role === "ta"
                        ? "TA"
                        : user.instructor
                          ? "Instructor"
                          : "Student";
                    const courseLabel = showCourseRole
                      ? user.courseId ?? course.trim()
                      : "—";

                    return (
                      <tr key={user.username} className="text-slate-700">
                        <td className="py-2 pr-4 font-medium">{user.username}</td>
                        <td className="py-2 pr-4">{user.asuid ?? "—"}</td>
                        <td className="py-2 pr-4">{roleLabel}</td>
                        <td className="py-2 pr-4">{courseLabel}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {hasSearched && results.length === 0 && !message && (
            <p className="mt-2 text-sm text-slate-500">No users matched this search.</p>
          )}
        </section>
      </div>
    </div>
  );
}
