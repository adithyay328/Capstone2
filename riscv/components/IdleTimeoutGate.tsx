"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function IdleTimeoutGate({
  children,
  timeoutMs = 30 * 60 * 1000, // default: (30 * 60 * 1000,); (10 * 1000,) 10s for testing 
  redirectTo = "/login",
}: {
  children: React.ReactNode;
  timeoutMs?: number;
  redirectTo?: string;
}) {
  const router = useRouter();
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const logout = () => {
      router.replace(redirectTo);
    };

    const reset = () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(logout, timeoutMs);
    };

    const events: Array<keyof WindowEventMap> = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
    ];

    //listen on window + document (more reliable)
    events.forEach((e) => {
      window.addEventListener(e, reset, { passive: true });
      document.addEventListener(e, reset, { passive: true });
    });

    //start timer immediately
    reset();

    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      events.forEach((e) => {
        window.removeEventListener(e, reset);
        document.removeEventListener(e, reset);
      });
    };
  }, [router, timeoutMs, redirectTo]);

  return <>{children}</>;
}
