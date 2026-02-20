'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { listLabs } from '@/app/api/list_labs/frontend';
import { createLab } from '@/app/api/create_lab/frontend';
import { deleteLab } from '@/app/api/delete_lab/frontend';
import { Lab } from '@/app/api/list_labs/types';

export default function InstructorLabsPage() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newLabName, setNewLabName] = useState('');
  const [creating, setCreating] = useState(false);

  const loadLabs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await listLabs();

      if (response.success && response.labs) {
        setLabs(response.labs);
      } else {
        setError(response.message || 'Failed to fetch labs');
      }
    } catch (err) {
      setError('An error occurred while fetching labs');
      console.error('Error fetching labs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLabs();
  }, []);

  const handleCreateLab = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newLabName.trim()) {
      alert('Please enter a lab name');
      return;
    }

    try {
      setCreating(true);
      const response = await createLab(newLabName.trim());

      if (response.success && response.lab) {
        await loadLabs();
        setNewLabName('');
      } else {
        alert(response.message || 'Failed to create lab');
      }
    } catch (err) {
      console.error('Error creating lab:', err);
      alert('An error occurred while creating the lab');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteLab = async (uid: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the lab "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await deleteLab(uid);

      if (response.success) {
        await loadLabs();
      } else {
        alert(response.message || 'Failed to delete lab');
      }
    } catch (err) {
      console.error('Error deleting lab:', err);
      alert('An error occurred while deleting the lab');
    }
  };

  const header = (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Instructor</p>
        <h1 className="text-3xl font-bold text-slate-900">Lab Management</h1>
        <p className="mt-2 text-sm text-slate-600">
          Create and manage labs for your course.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/instructor"
          className="inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl p-8 space-y-8">
          {header}
          <div className="flex flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-10 shadow-sm">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-600" />
            <p className="mt-4 text-sm text-slate-600">Loading labs...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-6xl p-8 space-y-8">
          {header}
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700"
            role="alert"
          >
            <strong className="font-semibold">Error:</strong> {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl p-8 space-y-8">
        {header}

        <section id="labs" className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Labs</h2>
              <p className="text-sm text-slate-500">{labs.length} total</p>
            </div>
          </div>
          {labs.length === 0 ? (
            <div className="p-6 text-sm text-slate-500">No labs available.</div>
          ) : (
            <ul className="divide-y divide-slate-200">
              {labs.map((lab) => (
                <li key={lab.uid} className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <Link href={`/instructor/edit_lab/${lab.uid}`} className="group flex-1">
                    <div>
                      <p className="text-base font-semibold text-indigo-600 group-hover:text-indigo-700">
                        {lab.title}
                      </p>
                      <p className="text-xs text-slate-500">Click to edit lab details</p>
                    </div>
                  </Link>
                  <button
                    onClick={() => handleDeleteLab(lab.uid, lab.title)}
                    className="inline-flex items-center justify-center rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    aria-label={`Delete ${lab.title}`}
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section id="create-lab" className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Create New Lab</h2>
          <p className="mt-1 text-sm text-slate-500">
            Set up a new lab shell. You can add instructions and test cases after creation.
          </p>
          <form onSubmit={handleCreateLab} className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label htmlFor="labName" className="block text-sm font-medium text-slate-700">
                Lab Name
              </label>
              <input
                type="text"
                id="labName"
                value={newLabName}
                onChange={(e) => setNewLabName(e.target.value)}
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Enter lab name"
                disabled={creating}
              />
            </div>
            <button
              type="submit"
              disabled={creating || !newLabName.trim()}
              className={`inline-flex items-center justify-center rounded-md px-6 py-2 text-sm font-medium text-white shadow-sm transition ${
                creating || !newLabName.trim()
                  ? 'cursor-not-allowed bg-slate-300'
                  : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
              }`}
            >
              {creating ? 'Creating...' : 'Create Lab'}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
