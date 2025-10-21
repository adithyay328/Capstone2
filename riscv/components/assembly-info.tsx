// AssemblyInfo.tsx
"use client";
import React from "react";

// If you want, you can re-declare the type here too,
// or just accept props as `any` temporarily:
type RunResponse = {
  hadError: boolean;
  errorMessage: string;
  registers: Record<string, string>;
  memory: Record<string, string>;
};

export default function AssemblyInfo({
  response,
}: {
  response: RunResponse | null;
}) {
  const hadError = response?.hadError ?? false;
  const errorMessage = response?.errorMessage ?? "";

  return (
    <div className="w-3/4 bg-gray-50 border-2 border-black rounded-2xl shadow-md p-4 space-y-3">
      <p className="font-semibold text-sm text-black">
        ERROR MESSAGE : {hadError ? (errorMessage || "Unknown error") : "NO ERRORS"}
      </p>

      <div className="flex justify-between text-sm gap-6">
        <div className="min-w-[200px]">
          <p className="font-semibold mb-1 text-black">REGISTERS</p>
          <div className="max-h-56 overflow-auto pr-2">
            {response?.registers
              ? Object.entries(response.registers).map(([name, hex]) => (
                  <p key={name} className="text-black">
                    {name} : {hex}
                  </p>
                ))
              : <p className="text-gray-500">—</p>}
          </div>
        </div>

        <div className="min-w-[240px]">
          <p className="font-semibold mb-1 text-black">MEMORY</p>
          <div className="max-h-56 overflow-auto pr-2">
            {response?.memory
              ? Object.entries(response.memory).map(([addr, hex]) => (
                  <p key={addr} className="text-black">
                    {addr}: {hex}
                  </p>
                ))
              : <p className="text-gray-500">—</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
