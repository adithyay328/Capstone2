"use client";

import React from "react";
import IdleTimeoutGate from "@/components/IdleTimeoutGate";
import { InstructorStudioBackground } from "@/components/instructor-shell";

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  return (
    <IdleTimeoutGate
      timeoutMs={30 * 60 * 1000}
      redirectTo="/instructor/login"
    >
      <InstructorStudioBackground>
        <div className="min-h-screen">{children}</div>
      </InstructorStudioBackground>
      <div className="instructor-shell min-h-screen">{children}</div>
    </IdleTimeoutGate>
  );
}
