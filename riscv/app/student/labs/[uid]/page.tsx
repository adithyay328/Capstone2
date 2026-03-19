'use client';

import { useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';

export default function StudentLabDetailPage() {
  const params = useParams<{ uid: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get('course_id') ?? '';

  useEffect(() => {
    if (!params.uid) {
      router.replace('/student/labs');
      return;
    }
    if (!courseId) {
      router.replace('/student/labs');
      return;
    }

    router.replace(
      `/student/labs-root?course_id=${encodeURIComponent(courseId)}&lab=${encodeURIComponent(params.uid)}`
    );
  }, [courseId, params.uid, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[rgb(82,82,82)] text-zinc-100 px-6">
      <div className="h-12 w-12 rounded-full border-4 border-zinc-500 border-t-transparent animate-spin" />
    </div>
  );
}
