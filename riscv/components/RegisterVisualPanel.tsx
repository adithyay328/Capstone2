//RegisterVisualPanel
"use client";
import * as React from "react";
import SevenSegment from "./SevenSegment";
import Led from "./Led";

type Registers = Record<string, string | number>;

function hexify(v: string | number | undefined){
  if (v === undefined || v === null) return "0x0";
  if (typeof v === "string") {
    if (v.startsWith("0x") || v.startsWith("0X")) return v;
    const n = Number(v);
    return "0x" + (isNaN(n) ? 0 : (n >>> 0)).toString(16);
  }
  return "0x" + (v >>> 0).toString(16);
}

function toNum(v: string | number | undefined) {
  if (v === undefined || v === null) return 0;
  if (typeof v === "number") return v >>> 0;
  const s = v.trim();
  if (s.startsWith("0x") || s.startsWith("0X")){
    return parseInt(s, 16) || 0; 
  }
  return parseInt(s, 10) || 0;
}

export default function RegisterVisualPanel({
  registers,
  track = "x12",
  digits = 4,
}: {
  registers: Registers | null;
  track?: string;
  digits?: number;
}) {
  const options = React.useMemo(() => {
    if (!registers) return [] as string[];
    const keys = Object.keys(registers);
    return keys.sort((a, b) => {
      const ma = a.match(/^x(\d+)$/);
      const mb = b.match(/^x(\d+)$/);
      if (ma && mb) return Number(ma[1]) - Number(mb[1]);
      if (ma) return -1;
      if (mb) return 1;
      return a.localeCompare(b);
    });
  }, [registers]);

  const [selectedTrack, setSelectedTrack] = React.useState(track);

  React.useEffect(() => {
    if (!options.length) return;
    if (!options.includes(selectedTrack)) {
      setSelectedTrack(options.includes(track) ? track : options[0]);
    }
  }, [options, selectedTrack, track]);

  const valueHex = React.useMemo(
    () => hexify(registers?.[selectedTrack]),
    [registers, selectedTrack]
  );
  const valueNum = React.useMemo(
    () => toNum(registers?.[selectedTrack]),
    [registers, selectedTrack]
  );

  return (
    <div className="rounded-2xl p-4 bg-neutral-900 border border-neutral-800">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-neutral-100">
            Display &amp; LEDs
          </h3>
          <p className="text-neutral-400 text-sm">
            Tracking <span className="font-mono">{selectedTrack}</span> ={" "}
            <span className="font-mono">{valueHex.toUpperCase()}</span>
          </p>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="text-xs text-neutral-400">Tracked register</span>
          <select
            className="text-sm bg-neutral-800 border border-neutral-700 rounded-md px-2 py-1 text-neutral-100 focus:outline-none focus:ring-1 focus:ring-amber-400"
            value={selectedTrack}
            onChange={(e) => setSelectedTrack(e.target.value)}
            disabled={!options.length}
          >
            {options.length === 0 ? (
              <option>No registers</option>
            ) : (
              options.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))
            )}
          </select>
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
