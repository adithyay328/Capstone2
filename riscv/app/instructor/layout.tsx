"use client";

import React from "react";
import IdleTimeoutGate from "@/components/IdleTimeoutGate";

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  return (
    <IdleTimeoutGate
      timeoutMs={30 * 60 * 1000}           // testing: 10 seconds 10 * 1000
      redirectTo="/instructor/login"  // IMPORTANT: instructor login route
    >
      <div className="instructor-shell min-h-screen">{children}</div>
    </IdleTimeoutGate>
  );
}
