import { NextResponse } from "next/server";

let sessions: Record<
  string,
  { code: string; lines: string[]; currentLine: number; registers: any; memory: any }
> = {};

export async function POST(req: Request) {
  const { code } = await req.json();

  // Create new session
  const sessionId = Math.random().toString(36).slice(2);
  sessions[sessionId] = {
    code,
    lines: code.split(/\r?\n/),
    currentLine: 1,
    registers: { x0: 0, x1: 0, x2: 0, a0: 0, a1: 0 },
    memory: { "0x00000000": 0 },
  };

  return NextResponse.json({
    sessionId,
    state: sessions[sessionId],
  });
}

// Helper for Step to use (you’ll import this later if you want)
export function getSession(id: string) {
  return sessions[id];
}
