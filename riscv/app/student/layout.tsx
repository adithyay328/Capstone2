"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

//set timeout at 30 mins (idle timeout)
const TIMEOUT_MS = 30 * 60 * 1000; //30 * 60 * 1000;

// quick testing options:
// const TIMEOUT_MS = 10 * 1000;      // 10 seconds
// const TIMEOUT_MS = 5 * 60 * 1000;  // 5 minutes

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const logout = () => router.replace("/");

    const reset = () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(logout, TIMEOUT_MS);
    };

    reset();

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
    const onActivity = () => reset();

    // listen on both document + window
    events.forEach((e) => {
      window.addEventListener(e, onActivity, { passive: true });
      document.addEventListener(e, onActivity, { passive: true });
    });

    // treat returning to tab as activity
    const onVisibility = () => {
      if (!document.hidden) reset();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);

    return () => {
      if (timerRef.current !== null) clearTimeout(timerRef.current);
      events.forEach((e) => {
        window.removeEventListener(e, onActivity);
        document.removeEventListener(e, onActivity);
      });
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, [router]);

  return <div className="min-h-screen">{children}</div>;
}