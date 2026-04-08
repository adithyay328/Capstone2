import StudentLabRoutePage from "@/components/student-lab-route-page";

type StudentLabDetailPageProps = {
  params: Promise<{ uid: string }>;
  searchParams?: Promise<{ course_id?: string | string[] | undefined }>;
};

function getSingleSearchParam(
  value: string | string[] | undefined
): string {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default async function StudentLabDetailPage({
  params,
  searchParams,
}: StudentLabDetailPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await (
    searchParams ?? Promise.resolve({} as { course_id?: string | string[] | undefined })
  );
  const courseId = getSingleSearchParam(resolvedSearchParams.course_id).trim();

  return (
    <StudentLabRoutePage
      courseId={courseId}
      labUid={resolvedParams.uid}
    />
  );
}
