"use client";
import React from "react";
import CodeEditor from "./code-editor";
import AssemblyInfo from "./assembly-info";

//BACKEND MUST MATCH THIS
type SubmitRequest = {code: string};

//BACKEND MUST MATCH THIS
type SubmitResponse = {
    hadError: boolean;
    errorMessage: string;
    registers: Record<string, string>; //register, value 
    memory: Record<string, string>; //mem addr, value
}

export default function Root() {
    const [code, setCode] = React.useState("");
    const [resp, setResp] = React.useState<SubmitResponse | null>(null);
    const [loading, setLoading] = React.useState(false);
    const [fatalError, setFatalError] = React.useState<string | null>(null);


  async function handleSubmit() {
    setLoading(true);
    setFatalError(null);
    await new Promise(r => setTimeout(r, 500));
    try {
    const response = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({code} satisfies SubmitRequest)
    });
    if (!response.ok)
    {
        const txt = await response.text();
        throw new Error(txt || `HTTP ${response.status}`);
    }
    const json = (await response.json()) as SubmitResponse;
    setResp(json);
    } catch (g: any)
    {
        setResp(null);
        setFatalError(g?.message ?? "unexpected error");
    }
    finally {
        setLoading(false);
    }
  }

  return (
    <div className="relative">
    {loading && (
      <div className="absolute inset-x-0 top-2 z-10 mx-auto w-fit rounded bg-black/80 px-3 py-1 text-xs text-white">
        Running…
      </div>
    )}
      <CodeEditor value={code} onChange={setCode} fontSize={14} onRun={handleSubmit} />
      {fatalError && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {fatalError}
        </div>
      )}

      <AssemblyInfo response={resp}/>
    </div>
  );
}
