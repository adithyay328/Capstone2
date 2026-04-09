//RegisterVisualPanel.tsx

"use client";
import * as React from "react";
import SevenSegment from "./SevenSegment";   
import Led from "./Led";                     

type Registers = Record<string, string | number>;

function hexify(v: string | number | undefined) {
  if (v === undefined || v === null) return "0x0";
  if (typeof v === "string") return v.startsWith("0x") ? v : "0x"+Number(v).toString(16);
  return "0x" + (v >>> 0).toString(16);
}

function toNum(v: string | number | undefined) {
  if (v === undefined || v === null) return 0;
  if (typeof v === "number") return v >>> 0;
  return parseInt(v as string, 16) || 0;
}

function normalizeTrack(value: string) {
  const trimmed = value.trim().toLowerCase();
  const match = /^x([1-9]|[12][0-9]|3[01])$/.exec(trimmed);
  if (!match) return null;
  return `x${Number(match[1])}`;
}

export default function RegisterVisualPanel({
  registers,
  track = "x1",
  digits = 4,
}: {
  registers: Registers | null;
  track?: string;
  digits?: number;
}) {
  const [selectedTrack, setSelectedTrack] = React.useState(track);
  const [inputValue, setInputValue] = React.useState(track);
  const [isEditing, setIsEditing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setSelectedTrack(track);
    setInputValue(track);
  }, [track]);

  const valueHex = React.useMemo(
    () => hexify(registers?.[selectedTrack]),
    [registers, selectedTrack]
  );
  const valueNum = React.useMemo(
    () => toNum(registers?.[selectedTrack]),
    [registers, selectedTrack]
  );

  const commitInput = React.useCallback(() => {
    const normalized = normalizeTrack(inputValue);
    if (!normalized) {
      setError("Register must be x1–x31.");
      return;
    }
    setSelectedTrack(normalized);
    setInputValue(normalized);
    setIsEditing(false);
    setError(null);
  }, [inputValue]);

  return (
    <div className="w-full rounded-2xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-neutral-100">Display & LEDs</h3>
          <p className="text-neutral-400 text-sm">
            Tracking{" "}
            <span className="font-mono">
              {isEditing ? (
                <input
                  className="bg-neutral-800 text-neutral-100 border border-neutral-700 rounded px-2 py-0.5 text-sm w-16"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onBlur={commitInput}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitInput();
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setInputValue(selectedTrack);
                      setIsEditing(false);
                      setError(null);
                    }
                  }}
                  autoFocus
                  aria-label="Register to track"
                />
              ) : (
                <button
                  type="button"
                  className="rounded border border-neutral-700 bg-neutral-800 px-2 py-0.5 text-sm hover:border-neutral-500"
                  onClick={() => {
                    setInputValue(selectedTrack);
                    setIsEditing(true);
                  }}
                >
                  {selectedTrack}
                </button>
              )}
            </span>{" "}
            = <span className="font-mono">{valueHex.toUpperCase()}</span>
          </p>
          {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        </div>
      </div>

      <div className="mt-4">
        <SevenSegment hex={valueHex} digits={digits} />
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Led on={valueNum > 0} label={`${selectedTrack}>0`} />
        <Led on={(valueNum & 0x1) !== 0} label="bit0" />
        <Led on={(valueNum & 0x2) !== 0} label="bit1" />
        <Led on={(valueNum & 0x4) !== 0} label="bit2" />
        <Led on={(valueNum & 0x8) !== 0} label="bit3" />
      </div>
    </div>
  );
}
