"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import LabRoot from "@/components/lab_root";

function StudentLabsRootPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const labUid = searchParams.get("lab");

  useEffect(() => {
    if (!labUid) {
      router.replace("/student/labs");
    }
  }, [labUid, router]);

  if (!labUid) {
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
