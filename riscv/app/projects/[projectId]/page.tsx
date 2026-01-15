"use client";
import Root from "../../../components/root";

export default function ProjectPage({
  params,
}: {
  params: { projectId: string };
}) {
  return <Root initialView="editor" initialProjectId={params.projectId} />;
}
