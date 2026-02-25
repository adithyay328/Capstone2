"use client";

import React, { useEffect } from "react";
import IdleTimeoutGate from "@/components/IdleTimeoutGate";

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log("✅ InstructorLayout mounted");
  }, []);

  return (
    <IdleTimeoutGate
      timeoutMs={10 * 1000}           // testing: 10 seconds
      redirectTo="/instructor/login"  // IMPORTANT: instructor login route
    >
      <div className="min-h-screen">{children}</div>
    </IdleTimeoutGate>
  );
}