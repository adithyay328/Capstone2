// AssemblyInfo.tsx
"use client";
import React from "react";

/**
 * The backend returns this shape. Keys in `registers` are things like "x0", "x1", ... "x31".
 * Keys in `memory` are hex addresses like "0x0", "0x4", "0x10", etc.
 */
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

  /**
   * ----------------------------
   * WHY WE NEED NUMERIC SORTING
   * ----------------------------
   * By default, JS object key iteration is string-based. That causes "x10" to come right after "x1"
   * (because "x10" < "x2" lexicographically), which is wrong for registers.
   *
   * We fix it by extracting the numeric part of the register name and comparing as numbers:
   *   "x2"  -> 2
   *   "x10" -> 10
   * so the order becomes x0, x1, x2, ... x9, x10, x11, ...
   *
   * Implementation details:
   * - We use a comparator for .sort(([a], [b]) => ...)
   * - We strip non-digits via a regex and parse the remainder in base 10
   * - If parsing fails (e.g., unexpected key), we fall back to string comparison to keep it stable
   */
  const sortedRegisters = response?.registers
    ? Object.entries(response.registers).sort(([a], [b]) => {
        // Extract the numeric suffix from keys like "x0", "x1", ..., "x31"
        // \D matches non-digits; replace them with "" to keep only digits
        const numA = parseInt(a.replace(/\D/g, ""), 10);
        const numB = parseInt(b.replace(/\D/g, ""), 10);

        // If both keys look like normal registers (x0..x31), compare numerically
        if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
          return numA - numB;
        }

        // Fallback: if keys are unusual (e.g., "pc"), or parsing failed,
        // do a stable-ish string compare so we still render deterministically.
        // Note: if you want "pc" at the top/bottom, you could special-case it here.
        return a.localeCompare(b, undefined, { numeric: true });
      })
    : [];

  /**
   * ----------------------------
   * MEMORY ADDRESS SORTING (HEX)
   * ----------------------------
   * Memory addresses arrive as hex strings, e.g., "0x0", "0x4", "0x10".
   * Lexicographic order would place "0x10" before "0x4", which is wrong.
   *
   * We fix this by:
   * - Parsing each address as a base-16 integer
   * - Comparing the numeric addresses
   *
   * Implementation details:
   * - parseInt("0x10", 16) === 16
   * - We add graceful fallback if an address is not parseable (keep string order)
   */
  const sortedMemory = response?.memory
    ? Object.entries(response.memory).sort(([a], [b]) => {
        const addrA = parseInt(a, 16);
        const addrB = parseInt(b, 16);

        if (!Number.isNaN(addrA) && !Number.isNaN(addrB)) {
          return addrA - addrB;
        }

        // Fallback if parse failed (unexpected format): keep a predictable order
        return a.localeCompare(b, undefined, { numeric: true });
      })
    : [];

  return (
    <div className="w-full md:w-[420px] md:flex-none bg-gray-50 border-2 border-black rounded-2xl shadow-md p-4 space-y-3">
      {/* Show either a clear error message from backend or a "NO ERRORS" flag */}
      <p className="font-semibold text-sm text-black">
        ERROR MESSAGE: {hadError ? errorMessage || "Unknown error" : "NO ERRORS"}
      </p>

      <div className="flex justify-between text-sm gap-6">
        {/* ----------------- REGISTERS PANEL ----------------- */}
        <div className="min-w-[200px]">
          <p className="font-semibold mb-1 text-black">REGISTERS</p>

          {/* 
            We render the numerically sorted registers.
            - If empty, show an em dash to indicate "no data".
            - Each line is "xN: 0x..." 
          */}
          <div className="max-h-56 overflow-auto pr-2">
            {sortedRegisters.length > 0 ? (
              sortedRegisters.map(([name, hex]) => (
                <p key={name} className="text-black">
                  {name}: {hex}
                </p>
              ))
            ) : (
              <p className="text-gray-500">—</p>
            )}
          </div>
        </div>

        {/* ------------------- MEMORY PANEL ------------------- */}
        <div className="min-w-[240px]">
          <p className="font-semibold mb-1 text-black">MEMORY</p>

          {/* 
            We render the hex-address-sorted memory.
            - Addresses are parsed as base-16 for correct ordering.
            - If empty, show an em dash for clarity.
          */}
          <div className="max-h-56 overflow-auto pr-2">
            {sortedMemory.length > 0 ? (
              sortedMemory.map(([addr, hex]) => (
                <p key={addr} className="text-black">
                  {addr}: {hex}
                </p>
              ))
            ) : (
              <p className="text-gray-500">—</p>
            )}
          </div>
        </div>
      </div>

      {/*
        -------------------- NOTES / EXTENSIBILITY --------------------
        - If your backend ever includes special keys like "pc" in registers,
          and you want "pc" always first, you can special-case it in the
          comparator, e.g.:
            if (a === "pc") return -1;
            if (b === "pc") return 1;
        - If you have large maps, consider memoizing the sorted arrays with
          useMemo to avoid re-sorting on every render when `response`
          doesn't change.
        - If memory keys can be mixed-case ("0xA" vs "0xa"), parseInt handles
          both fine; rendering can normalize to lowercase if desired.
      */}
    </div>
  );
}
