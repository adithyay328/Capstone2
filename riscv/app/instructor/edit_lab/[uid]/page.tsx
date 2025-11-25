'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { listLabs } from '@/app/api/list_labs/frontend';
import { updateLab } from '@/app/api/update_lab/frontend';
import { Lab } from '@/app/api/list_labs/types';
import dynamic from 'next/dynamic';

// Dynamically import the markdown editor to avoid SSR issues
const MdEditor = dynamic(
  () => import('md-editor-rt').then((mod) => mod.MdEditor),
  { ssr: false }
);

// Import the CSS for the markdown editor
import 'md-editor-rt/lib/style.css';

export default function EditLabPage() {
  const params = useParams<{ uid: string }>();
  const router = useRouter();
  const [lab, setLab] = useState<Lab | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
            setTitle(foundLab.title);
            setContent(foundLab.md);
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

  const handleSave = async () => {
    if (!lab) return;

    try {
      setSaving(true);
      setSaveSuccess(false);
      setError(null);

      const updatedLab: Lab = {
        uid: lab.uid,
        title: title,
        md: content
      };

      const response = await updateLab(updatedLab);

      if (response.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setError(response.message || 'Failed to update lab');
      }
    } catch (err) {
      setError('An error occurred while saving the lab');
      console.error('Error saving lab:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Edit Lab</h1>
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
          <h1 className="text-3xl font-bold mb-6">Edit Lab</h1>
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
          <h1 className="text-3xl font-bold mb-6">Edit Lab</h1>
          <div className="text-center py-8">
            <p className="text-gray-500">Lab not found.</p>
            <button 
              onClick={() => router.back()}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="w-4/5 mx-auto">
        <div className="mb-6">
          <button 
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Lab List
          </button>
          <h1 className="text-3xl font-bold">Edit Lab</h1>
        </div>

        <div className="mb-6">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Lab Title
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter lab title"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Lab Content
          </label>
          <div className="border border-gray-300 rounded-md overflow-hidden">
            {typeof window !== 'undefined' && (
              <MdEditor
                modelValue={content}
                onChange={setContent}
                toolbarsExclude={['htmlPreview', 'catalog']}
                style={{ height: '700px' }}
              />
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-6 py-2 rounded-md text-white font-medium ${
              saving 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            }`}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          {saveSuccess && (
            <div className="text-green-600 font-medium">
              Lab updated successfully!
            </div>
          )}

          {error && !loading && (
            <div className="text-red-600 font-medium">
              Error: {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
