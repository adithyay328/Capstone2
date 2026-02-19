import { NextResponse } from "next/server";
import { modifyCookieData } from "@/app/verify/modify";

export async function POST() {
  const clearedCookie = await modifyCookieData({});

  return NextResponse.json(
    { success: true },
    {
      status: 200,
      headers: {
        "Set-Cookie": clearedCookie,
      },
    }
  );
}
