import { NextResponse } from "next/server";

type RunRequest = { code: string };
type RunResponse = {
  hadError: boolean;
  errorMessage: string;                 // "" if none
  registers: Record<string, string>;    // { "x0": "0x0000000a", ... }
  memory: Record<string, string>;       // { "0x0000": "0x0000000b", ... }
};

const BACKEND_URL = "http://localhost:25565/data";

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

  // Forward request to Python Flask backend
  try {
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      return NextResponse.json(
        { 
          hadError: true, 
          errorMessage: `Backend server error: ${response.status} ${response.statusText}`, 
          registers: {}, 
          memory: {} 
        } satisfies RunResponse,
        { status: 200 }
      );
    }

    const data: RunResponse = await response.json();
    return NextResponse.json(data, { status: 200 });

  } catch (error) {
    return NextResponse.json(
      { 
        hadError: true, 
        errorMessage: `Failed to connect to backend server: ${error instanceof Error ? error.message : String(error)}`, 
        registers: {}, 
        memory: {} 
      } satisfies RunResponse,
      { status: 200 }
    );
  }
}

// optional quick health check for GET /api/run
export async function GET() {
  return NextResponse.json({ ok: true, message: "/api/run connected to Python backend" });
}
