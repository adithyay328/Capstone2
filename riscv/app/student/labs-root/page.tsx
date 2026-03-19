"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LabRoot from "@/components/lab_root";

function StudentLabsRootPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("course_id");
  const labUid = searchParams.get("lab");

  useEffect(() => {
    if (!courseId || !labUid) {
      router.replace("/student/labs");
    }
  }, [courseId, labUid, router]);

  if (!courseId || !labUid) {
    return null;
  }

  return <LabRoot />;
}

export default function StudentLabsRootPage() {
  return (
    <Suspense fallback={null}>
      <StudentLabsRootPageContent />
    </Suspense>
  );
}
