"use client";

type ClientSessionData = {
  username?: string;
  student?: boolean;
  instructor?: boolean;
  ta?: boolean;
};

function readSensCookie(): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie.match(/(?:^|;\s*)sens=([^;]*)/);
  return match ? match[1] : null;
}

export function getClientSessionData(): ClientSessionData | null {
  const rawCookie = readSensCookie();
  if (!rawCookie) return null;

  try {
    const decoded = decodeURIComponent(rawCookie);
    const parsed = JSON.parse(decoded) as {
      data?: ClientSessionData;
    };

    if (!parsed.data || typeof parsed.data !== "object") {
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

export function getClientUsername(): string | null {
  const session = getClientSessionData();
  return typeof session?.username === "string" && session.username.trim()
    ? session.username
    : null;
}
