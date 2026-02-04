'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { listLabs } from '@/app/api/list_labs/frontend';
import { Lab } from '@/app/api/list_labs/types';
import dynamic from 'next/dynamic';
import Link from 'next/link';

// Dynamically import the markdown preview to avoid SSR issues
const MdPreview = dynamic(
  () => import('md-editor-rt').then((mod) => mod.MdPreview),
  { ssr: false }
);

// Import the CSS for the markdown preview
import 'md-editor-rt/lib/preview.css';

export default function StudentLabDetailPage() {
  const params = useParams<{ uid: string }>();
  const router = useRouter();
  const [lab, setLab] = useState<Lab | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLab = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await listLabs();
        
        if (response.success && response.labs) {
          const foundLab = response.labs.find(l => l.uid === params.uid);
          if (foundLab) {
            setLab(foundLab);
          } else {
            setError('Lab not found');
          }
        } else {
          setError(response.message || 'Failed to fetch labs');
        }
      } catch (err) {
        setError('An error occurred while fetching the lab');
        console.error('Error fetching lab:', err);
      } finally {
        setLoading(false);
      }
    };

    if (params.uid) {
      fetchLab();
    }
  }, [params.uid]);

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Lab</h1>
            <Link 
              href="/student/labs" 
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Labs
            </Link>
          </div>
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2">Loading lab...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Lab</h1>
            <Link 
              href="/student/labs" 
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Labs
            </Link>
          </div>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            <button 
              onClick={() => router.back()}
              className="mt-2 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!lab) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold">Lab</h1>
            <Link 
              href="/student/labs" 
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Labs
            </Link>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-500">Lab not found.</p>
            <Link 
              href="/student/labs" 
              className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Back to Lab List
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Lab</h1>
          <Link 
            href="/student/labs" 
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Labs
          </Link>
        </div>

        <div className="bg-white shadow sm:rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{lab.title}</h1>
          
          <div className="border border-gray-300 rounded-md max-h-[70vh] overflow-y-auto">
            {typeof window !== 'undefined' && (
              <MdPreview
                modelValue={lab.md}
                language="en-US"
                style={{ minHeight: '70vh' }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
