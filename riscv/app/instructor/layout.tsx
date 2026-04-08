"use client";

import React, { useEffect } from "react";
import IdleTimeoutGate from "@/components/IdleTimeoutGate";
import { InstructorStudioBackground } from "@/components/instructor-shell";

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    console.log("InstructorLayout mounted");
  }, []);

  return (
    <IdleTimeoutGate
      timeoutMs={30 * 60 * 1000}
      redirectTo="/instructor/login"
    >
      <InstructorStudioBackground>
        <div className="min-h-screen">{children}</div>
      </InstructorStudioBackground>
    </IdleTimeoutGate>
  );
}