"use client";
import React from "react";
import CodeEditor from "./code-editor";
import AssemblyInfo from "./assembly-info";


//BACKEND MUST MATCH THIS
type SubmitRequest = { code: string };

//BACKEND MUST MATCH THIS
type SubmitResponse = {
  hadError: boolean;
  errorMessage: string;
  registers: Record<string, string>; // register -> value
  memory: Record<string, string>;    // addr -> value
};

// State shape returned by /api/sim
type SimState = {
  currentLine: number;
  halted: boolean;
  registers: Record<string, number | string>;
  memory: Record<string, number | string>;
  errorMessage?: string | null;
};



export default function Root() {
  const [code, setCode] = React.useState("");
  const [resp, setResp] = React.useState<SubmitResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [fatalError, setFatalError] = React.useState<string | null>(null);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [simState, setSimState] = React.useState<SimState | null>(null);

  // --- Keep your full RUN logic exactly as-is (uses /api/run) ---
  async function handleSubmit() {
    setLoading(true);
    setFatalError(null);
    await new Promise((r) => setTimeout(r, 500));
    try {
      const response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code } satisfies SubmitRequest),
      });
      if (!response.ok) {
        const txt = await response.text();
        throw new Error(txt || `HTTP ${response.status}`);
      }
      const json = (await response.json()) as SubmitResponse;
      setResp(json);
    } catch (g: any) {
      setResp(null);
      setFatalError(g?.message ?? "unexpected error");
    } finally {
      setLoading(false);
    }
  }

  // ---- STEP/RESET helpers using /api/sim ----
  async function startIfNeeded(): Promise<string> {
    if (sessionId) return sessionId;
    const res = await fetch("/api/sim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", code }),
    });
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json() as { sessionId: string; state: SimState };
    setSessionId(json.sessionId);
    setSimState(json.state);
    setResp(simStateToSubmitResponse(json.state)); //POPUYLATE ASSEMBLY INFO TOO
    return json.sessionId;
  }

  function simStateToSubmitResponse(state: SimState): SubmitResponse {
    // Convert numbers to strings to match your SubmitResponse typing
    const toStr = (obj: Record<string, number | string>) =>
      Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, String(v)]));

    return {
      hadError: !!state.errorMessage,
      errorMessage: state.errorMessage ?? "NO ERRORS",
      registers: toStr(state.registers),
      memory: toStr(state.memory),
    };
  }

  async function handleStep() {
    setLoading(true);
    setFatalError(null);
    try {
      const sid = await startIfNeeded();
      const res = await fetch("/api/sim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "step", sessionId: sid }),
      });
      if (!res.ok) throw new Error(await res.text());
      const json = (await res.json()) as { state: SimState };
      setSimState(json.state);
      setResp(simStateToSubmitResponse(json.state));
    } catch (e: any) {
      setFatalError(e?.message ?? "step failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    setLoading(true);
    setFatalError(null);
    try {
      await fetch("/api/sim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      setSessionId(null);
      setResp(null);
    } catch (e: any) {
      setFatalError(e?.message ?? "reset failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative">
      {loading && (
        <div className="absolute inset-x-0 top-2 z-10 mx-auto w-fit rounded bg-black/80 px-3 py-1 text-xs text-white">
          Working…
        </div>
      )}

      <div className="flex flex-col md:flex-row md:flex-wrap gap-6 px-4">
        {/* Editor column */}
        <div className="w-full md:w-[65vw] lg:w-[70vw] xl:w-[75vw] mt-5">
          <CodeEditor value={code} onChange={setCode} fontSize={14} onRun={handleSubmit} currentLine={simState?.currentLine} />

          {/* Controls under the editor */}
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              onClick={handleStep}
              className="rounded bg-amber-600 px-4 py-2 text-white hover:bg-amber-700"
              disabled={loading}
            >
              Step
            </button>
            <button
              onClick={handleSubmit}
              className="rounded bg-black px-4 py-2 text-white hover:bg-zinc-900"
              disabled={loading}
            >
              Run
            </button>
            <button
              onClick={handleReset}
              className="rounded border px-4 py-2 hover:bg-zinc-100"
              disabled={loading}
            >
              Reset
            </button>
          </div>

          {fatalError && (
            <div className="mt-3 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {fatalError}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div className="w-full md:basis-[420px] md:flex-none">
          <AssemblyInfo response={resp} />
        </div>
      </div>
    </div>
  );
}
