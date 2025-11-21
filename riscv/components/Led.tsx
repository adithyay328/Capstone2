//Led.tsx
"use client";
import * as React from "react";

export default function Led({ on,label }: { on: boolean; label?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-5 h-5 rounded-full border
        ${on ? "bg-yellow-300 border-s-red-50 shadow-[0_0_8px_rgba(16,185,129,0.9)]"
             : "bg-neutral-700 border-neutral-600"}`} />
      {label ? <span className="text-sm text-neutral-100">{label}</span> : null}
    </div>
  );
}
