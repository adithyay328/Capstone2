"use client";
import React from "react";

type RegisterEditorProps = {
  registers: Record<string, string>;
  onChange: (key: string, value: string) => void;
  disabled?: boolean;
};

export default function RegisterEditor({ registers, onChange, disabled }: RegisterEditorProps) {
  return (
    <div
      className={`p-4 border rounded bg-white text-black ${
        disabled ? "opacity-60 cursor-not-allowed" : ""
      }`}
    >
      <h2 className="text-lg font-semibold mb-2">Registers</h2>
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(registers).map(([name, value]) => (
          <div key={name} className="flex items-center gap-2">
            <label className="w-12 text-sm font-mono">{name}</label>
            <input
              type="text"
              value={value ?? ""}
              disabled={disabled}
              // onChange={(e) => onChange(name, e.target.value)}
              onChange={(e) => {
                console.log("✏️ Changed register:", name, "to", e.target.value);
                onChange(name, e.target.value);
              }}
              className="w-20 border rounded px-2 py-1 text-sm font-mono text-black disabled:bg-zinc-200"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
