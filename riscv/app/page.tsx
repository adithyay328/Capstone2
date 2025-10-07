'use client';
import CodeEditor from "@/components/code-editor";
import { useState } from "react";
import AssemblyInfo from "@/components/assembly-info";

export default function Home() {
  const [code, setCode] = useState("");

  return (
    <div className="flex flex-col justify-center items-center w-screen space-y-4">
      <CodeEditor value={code} 
                  onChange={setCode} 
                  onRun={() => {
                    console.log("Running Code")
                  }}
      />
      <AssemblyInfo />
    </div>
  );
}
