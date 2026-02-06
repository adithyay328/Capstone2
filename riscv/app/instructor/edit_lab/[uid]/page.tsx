'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { listLabs } from '@/app/api/list_labs/frontend';
import { updateLab } from '@/app/api/update_lab/frontend';
import { Lab } from '@/app/api/list_labs/types';
import { listTestCases } from '@/app/api/list_test_cases/frontend';
import { createTestCase } from '@/app/api/create_test_case/frontend';
import { deleteTestCase } from '@/app/api/delete_test_case/frontend';
import type { TestCase } from '@/app/api/create_test_case/types';
import TestCaseEditor from '@/components/TestCaseEditor';
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
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [testCasesLoading, setTestCasesLoading] = useState(false);
  const [testCasesError, setTestCasesError] = useState<string | null>(null);
  const [newTestCaseName, setNewTestCaseName] = useState('');
  const [creatingTestCase, setCreatingTestCase] = useState(false);

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

  useEffect(() => {
    const fetchTestCases = async () => {
      if (!params.uid) return;
      try {
        setTestCasesLoading(true);
        setTestCasesError(null);
        const response = await listTestCases(params.uid);
        if (response.success && response.testCases) {
          setTestCases(response.testCases);
        } else {
          setTestCasesError(response.message || 'Failed to fetch test cases');
        }
      } catch (err) {
        console.error('Error fetching test cases:', err);
        setTestCasesError('An error occurred while fetching test cases');
      } finally {
        setTestCasesLoading(false);
      }
    };

    fetchTestCases();
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

  const handleCreateTestCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params.uid) return;
    if (!newTestCaseName.trim()) return;

    try {
      setCreatingTestCase(true);
      const response = await createTestCase(params.uid, newTestCaseName.trim());
      if (response.success && response.testCase) {
        setTestCases((prev) => [response.testCase!, ...prev]);
        setNewTestCaseName('');
      } else {
        setTestCasesError(response.message || 'Failed to create test case');
      }
    } catch (err) {
      console.error('Error creating test case:', err);
      setTestCasesError('An error occurred while creating test case');
    } finally {
      setCreatingTestCase(false);
    }
  };

  const handleDeleteTestCase = async (uid: string) => {
    try {
      const response = await deleteTestCase(uid);
      if (response.success) {
        setTestCases((prev) => prev.filter((tc) => tc.uid !== uid));
      } else {
        setTestCasesError(response.message || 'Failed to delete test case');
      }
    } catch (err) {
      console.error('Error deleting test case:', err);
      setTestCasesError('An error occurred while deleting test case');
    }
  };

  const handleUpdateTestCase = (updated: TestCase) => {
    setTestCases((prev) =>
      prev.map((tc) => (tc.uid === updated.uid ? updated : tc))
    );
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
            className="mb-4 inline-flex items-center gap-2 rounded-lg bg-blue-100 px-4 py-2 text-blue-700 font-medium hover:bg-blue-200 hover:text-blue-900 transition"
          >
            ← Back to Lab List
          </button>
          <h1 className="text-3xl font-bold">Edit Lab</h1>
        </div>

        <div className="mb-6">
          <label htmlFor="title" className="block text-sm font-medium text-white-700 mb-2">
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
          <label className="block text-sm font-medium text-white-700 mb-2">
            Lab Content
          </label>
          <div className="border border-gray-300 rounded-md overflow-auto">
            {typeof window !== 'undefined' && (
              <MdEditor
                modelValue={content}
                onChange={setContent}
                toolbarsExclude={['htmlPreview', 'catalog']}
                tableShape={[8, 15]} // columns, rows
                language="en-US"
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

        <div className="mt-10">
          <h2 className="text-2xl font-semibold mb-4">Test Cases</h2>

          <div className="bg-white shadow sm:rounded-lg p-4 mb-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Create Test Case</h3>
            <form onSubmit={handleCreateTestCase} className="flex gap-4">
              <div className="flex-grow">
                <label htmlFor="testCaseName" className="block text-sm font-medium text-gray-700 mb-1">
                  Test Case Name
                </label>
                <input
                  type="text"
                  id="testCaseName"
                  value={newTestCaseName}
                  onChange={(e) => setNewTestCaseName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-indigo-600 font-medium"
                  placeholder="Enter test case name"
                  disabled={creatingTestCase}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={creatingTestCase || !newTestCaseName.trim()}
                  className={`px-6 py-2 rounded-md text-white font-medium ${
                    creatingTestCase || !newTestCaseName.trim()
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                  }`}
                >
                  {creatingTestCase ? 'Creating...' : 'Create Test Case'}
                </button>
              </div>
            </form>
            {testCasesError && (
              <p className="mt-2 text-sm text-red-600">{testCasesError}</p>
            )}
          </div>

          {testCasesLoading ? (
            <div className="text-center py-6">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-gray-500">Loading test cases...</p>
            </div>
          ) : testCases.length === 0 ? (
            <p className="text-white-500">No test cases yet.</p>
          ) : (
            <div>
              {testCases.map((testCase) => (
                <TestCaseEditor
                  key={testCase.uid}
                  testCase={testCase}
                  onDelete={handleDeleteTestCase}
                  onUpdate={handleUpdateTestCase}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
