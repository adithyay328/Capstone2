import Link from "next/link";
import StudentHelpFeedbackForm from "@/components/student-help-feedback-form";

export default function StudentHelpPage() {
  return (
    <div className="px-4 py-6 md:px-6">
      <div className="rounded-xl border border-zinc-700 bg-gradient-to-br from-zinc-900/70 via-zinc-900/40 to-zinc-800/40 p-6 shadow-lg">
        <span className="text-xs uppercase tracking-widest text-zinc-400">
          Support
        </span>
        <h1 className="mt-2 text-2xl font-semibold">Help & Feedback</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-300">
          Find quick answers, learn how the editor works, and send us feedback to improve your experience.
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
              Use <span className="text-white">Run</span> to execute once and view output in the info panel.
            </li>
            <li className="rounded-lg border border-zinc-700/60 bg-zinc-900/60 p-3">
              Use <span className="text-white">Start</span> and <span className="text-white">Step</span> to walk through execution state-by-state.
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
          <StudentHelpFeedbackForm />
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-zinc-700 bg-zinc-900/40 p-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          FAQ
        </h3>
        <div className="mt-3 grid gap-3 text-sm text-zinc-300 md:grid-cols-2">
          <div className="rounded-lg border border-zinc-700/60 bg-zinc-900/60 p-3">
            Why is my output empty? Check that you used Run or Start and that your code compiles without errors.
          </div>
          <div className="rounded-lg border border-zinc-700/60 bg-zinc-900/60 p-3">
            Why can&apos;t I step? You must press Start before Step becomes active.
          </div>
        </div>
      </div>
    </div>
  );
}
