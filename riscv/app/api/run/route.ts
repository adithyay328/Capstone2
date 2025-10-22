//THIS NEEDS TO BE CHANGED

//STILL NEEDS TO BE CONNECTED TO REAL BACKEND

//USE route.ts (this file) TO  IMPLEMENT THIS






//from chatgpt
//basic mock back end

import { NextResponse } from "next/server";

type RunRequest = { code: string };
type RunResponse = {
  hadError: boolean;
  errorMessage: string;                 // "" if none
  registers: Record<string, string>;    // { "x0": "0x0000000a", ... }
  memory: Record<string, string>;       // { "0x0000": "0x0000000b", ... }
};

// small deterministic helpers so different code -> different values
function toHex32(n: number) {
  const u = n >>> 0;
  return "0x" + u.toString(16).padStart(8, "0");
}
function hash32(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export async function POST(req: Request) {
  let body: RunRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { hadError: true, errorMessage: "Invalid JSON", registers: {}, memory: {} } satisfies RunResponse,
      { status: 400 }
    );
  }

  const code = (body.code ?? "").trim();

  if (!code) {
    return NextResponse.json(
      { hadError: true, errorMessage: "No code provided.", registers: {}, memory: {} } satisfies RunResponse,
      { status: 200 }
    );
  }

  // simulate a parse error if code includes certain words
  if (/\b(error|panic|illegal)\b/i.test(code)) {
    return NextResponse.json(
      { hadError: true, errorMessage: "Parser error: illegal token.", registers: {}, memory: {} } satisfies RunResponse,
      { status: 200 }
    );
  }

  // generate fake-but-deterministic data
  const base = hash32(code);
  const registers: Record<string, string> = {};
  for (let i = 0; i < 8; i++) registers[`x${i}`] = toHex32(base + i * 0x1f);

  const memory: Record<string, string> = {};
  for (let i = 0; i < 6; i++) {
    const addr = "0x" + (i * 4).toString(16).padStart(4, "0");
    memory[addr] = toHex32(base ^ (i * 0xabcde));
  }

  return NextResponse.json(
    {
      hadError: false,
      errorMessage: "",
      registers,
      memory,
    } satisfies RunResponse,
    { status: 200 }
  );
}

// optional quick health check for GET /api/run
export async function GET() {
  return NextResponse.json({ ok: true, message: "mock /api/run ready" });
}
