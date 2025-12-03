//RegisterVisualPanel.tsx

"use client";
import * as React from "react";
import SevenSegment from "./SevenSegment";   
import Led from "./Led";                     

type Registers = Record<string, string | number>;
type Memory = Record<string, string | number>;

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

export default function RegisterVisualPanel({
  registers,
  memory,
  track = "x12",
  trackType = "register",
  digits = 4,
}: {
  registers: Registers | null;
  memory?: Memory | null;
  track?: string;
  trackType?: "register" | "memory";
  digits?: number;
}) {
  const valueHex = React.useMemo(() => {
    if (trackType === "memory") {
      return hexify(memory?.[track]);
    }
    return hexify(registers?.[track]);
  }, [registers, memory, track, trackType]);
  
  const valueNum = React.useMemo(() => {
    if (trackType === "memory") {
      return toNum(memory?.[track]);
    }
    return toNum(registers?.[track]);
  }, [registers, memory, track, trackType]);

  const trackingLabel = trackType === "memory" ? `Memory[${track}]` : `Register ${track}`;

  return (
    <div className="rounded-2xl p-4 bg-neutral-900 border border-neutral-800">
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-100">Display & LEDs</h3>
          <p className="text-neutral-400 text-sm">
            Tracking <span className="font-mono">{trackingLabel}</span> = <span className="font-mono">{valueHex.toUpperCase()}</span>
          </p>
        </div>
      </div>

      <div className="mt-4">
        <SevenSegment hex={valueHex} digits={digits} />
      </div>

      <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Led on={valueNum > 0} label={`${trackType === "memory" ? "mem" : "reg"}>0`} />
        <Led on={(valueNum & 0x1) !== 0} label="bit0" />
        <Led on={(valueNum & 0x2) !== 0} label="bit1" />
        <Led on={(valueNum & 0x4) !== 0} label="bit2" />
        <Led on={(valueNum & 0x8) !== 0} label="bit3" />
      </div>
    </div>
  );
}
