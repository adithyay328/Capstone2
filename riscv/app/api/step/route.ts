import { NextResponse } from "next/server";

// For simplicity, copy sessions definition here.
// (You can extract to a shared file later if you want.)
let sessions: Record<
  string,
  { code: string; lines: string[]; currentLine: number; registers: any; memory: any }
> = {};

export async function POST(req: Request) {
  const { sessionId } = await req.json();
  const session = sessions[sessionId];

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Mock: Move one line forward
  session.currentLine = Math.min(session.currentLine + 1, session.lines.length);

  // Mock register + memory updates
  session.registers[`a0`] = (session.registers[`a0`] ?? 0) + 1;
  session.memory["0x00000000"] = (session.memory["0x00000000"] ?? 0) + 1;

  const halted = session.currentLine >= session.lines.length;

  return NextResponse.json({
    state: {
      currentLine: session.currentLine,
      registers: session.registers,
      memory: session.memory,
      halted,
    },
  });
}
