import { NextResponse } from "next/server";
import { resetSessions } from "../_simStore";
export async function POST() {
    resetSessions();
  return NextResponse.json({ ok: true });
}
