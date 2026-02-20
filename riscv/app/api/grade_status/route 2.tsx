import { NextResponse } from "next/server";
import { GradeStatusRequest, GradeStatusResponse } from "./types";

const BACKEND_URL = "http://localhost:25565/grade_status";

export async function POST(req: Request) {
  let body: GradeStatusRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON" } satisfies GradeStatusResponse,
      { status: 400 }
    );
  }

  const lab_uid = (body.lab_uid ?? "").trim();
  if (!lab_uid) {
    return NextResponse.json(
      { error: "No lab_uid provided" } satisfies GradeStatusResponse,
      { status: 200 }
    );
  }

  try {
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ lab_uid }),
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `Backend server error: ${response.status} ${response.statusText}`,
        } satisfies GradeStatusResponse,
        { status: 200 }
      );
    }

    const data: GradeStatusResponse = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: `Failed to connect to backend server: ${
          error instanceof Error ? error.message : String(error)
        }`,
      } satisfies GradeStatusResponse,
      { status: 200 }
    );
  }
}
