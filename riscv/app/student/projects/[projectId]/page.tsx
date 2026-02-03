"use client";
import React from "react";
import Root from "@/components/root";

export default function StudentProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = React.use(params);
  return <Root initialView="editor" initialProjectId={projectId} />;
}
