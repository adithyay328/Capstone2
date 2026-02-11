"use client";
import { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/sidebar";

export default function HelpPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
    window.setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[rgb(82,82,82)] text-zinc-100 flex">
      <Sidebar initialOpen={false} />
      <main className="flex-1 relative pl-16">
        <div className="px-4 mt-6 md:px-6">
          <div className="rounded-xl border border-zinc-700 bg-gradient-to-br from-zinc-900/70 via-zinc-900/40 to-zinc-800/40 p-6 shadow-lg">
            <span className="text-xs uppercase tracking-widest text-zinc-400">
              Support
            </span>
            <h1 className="mt-2 text-2xl font-semibold">Help & Feedback</h1>
            <p className="mt-2 text-sm text-zinc-300 max-w-2xl">
              Find quick answers, learn how the editor works, and send us
              feedback to improve your experience.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/student/docs"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                View Documentation
              </Link>
              <a
                href="mailto:support@example.com"
                className="rounded-md border border-zinc-600 px-4 py-2 text-sm font-medium text-zinc-200 hover:bg-zinc-900"
              >
                Email Support
              </a>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-700 bg-zinc-900/50 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                Quick Help
              </h2>
              <ul className="mt-3 space-y-3 text-sm text-zinc-300">
                <li className="rounded-lg border border-zinc-700/60 bg-zinc-900/60 p-3">
                  Use <span className="text-white">Run</span> to execute once and
                  view output in the info panel.
                </li>
                <li className="rounded-lg border border-zinc-700/60 bg-zinc-900/60 p-3">
                  Use <span className="text-white">Start</span> and{" "}
                  <span className="text-white">Step</span> to walk through
                  execution state-by-state.
                </li>
                <li className="rounded-lg border border-zinc-700/60 bg-zinc-900/60 p-3">
                  Reset clears your session without deleting your project.
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-zinc-700 bg-zinc-900/50 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
                Feedback
              </h2>
              <form onSubmit={handleSubmit} className="mt-3 space-y-3">
                <div>
                  <label className="text-xs text-zinc-400">Topic</label>
                  <input
                    type="text"
                    placeholder="Bug report, idea, question..."
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-zinc-400">Message</label>
                  <textarea
                    rows={4}
                    placeholder="Tell us what you ran into and how we can help."
                    className="mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    Send Feedback
                  </button>
                  {submitted && (
                    <span className="text-xs text-green-400">
                      Thanks! Your feedback was sent.
                    </span>
                  )}
                </div>
              </form>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-zinc-700 bg-zinc-900/40 p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
              FAQ
            </h3>
            <div className="mt-3 grid gap-3 text-sm text-zinc-300 md:grid-cols-2">
              <div className="rounded-lg border border-zinc-700/60 bg-zinc-900/60 p-3">
                Why is my output empty? Check that you used Run or Start and that
                your code compiles without errors.
              </div>
              <div className="rounded-lg border border-zinc-700/60 bg-zinc-900/60 p-3">
                Why can&apos;t I step? You must press Start before Step becomes
                active.
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
