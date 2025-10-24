// app/api/sim/route.ts
import { NextResponse } from "next/server";

type Session = {
  code: string;
  lines: string[];
  currentLine: number;                    // 1-based
  registers: Record<string, number>;
  memory: Record<string, number>;
  halted: boolean;
  errorMessage?: string | null;
};

let sessions: Record<string, Session> = {};

function toState(s: Session) {
  return {
    currentLine: s.currentLine,
    halted: s.halted,
    registers: s.registers,
    memory: s.memory,
    errorMessage: s.errorMessage ?? null,
  };
}

export async function POST(req: Request) {
  const body = (await req.json()) as
    | { action: "start"; code: string }
    | { action: "step"; sessionId: string }
    | { action: "reset" };

  if (body.action === "start") {
    const id =
      globalThis.crypto?.randomUUID?.() ??
      Math.random().toString(36).slice(2);
    const lines = (body.code ?? "").split(/\r?\n/);
    sessions[id] = {
      code: body.code ?? "",
      lines,
      currentLine: 1,
      registers: { a0: 0, a1: 0 }, // demo init
      memory: { 0: 0 },            // demo init
      halted: lines.length <= 1,
    };
    return NextResponse.json({ sessionId: id, state: toState(sessions[id]) });
  }

  if (body.action === "step") {
    const s = sessions[body.sessionId];
    if (!s) return new NextResponse("Session not found", { status: 404 });

    // --- DEMO STEP: advance one line + tweak a register/memory ---
    s.currentLine = Math.min(s.currentLine + 1, s.lines.length);
    s.registers.a0 = (s.registers.a0 ?? 0) + 1;
    s.memory[0] = (s.memory[0] ?? 0) + 1;
    s.halted = s.currentLine >= s.lines.length;
    // -------------------------------------------------------------

    return NextResponse.json({ state: toState(s) });
  }

  if (body.action === "reset") {
    sessions = {};
    return NextResponse.json({ ok: true });
  }

  return new NextResponse("Bad action", { status: 400 });
}
