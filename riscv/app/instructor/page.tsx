'use client';

import { useState, useEffect } from 'react';
import { listLabs } from '@/app/api/list_labs/frontend';
import { createLab } from '@/app/api/create_lab/frontend';
import { deleteLab } from '@/app/api/delete_lab/frontend';
import { Lab } from '@/app/api/list_labs/types';
import Link from 'next/link';

export default function InstructorPage() {
    const [labs, setLabs] = useState<Lab[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newLabName, setNewLabName] = useState('');
    const [creating, setCreating] = useState(false);

    // Dedicated load function that fetches labs from backend
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

    // Load labs on component mount
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
                // Reload labs from backend to ensure proper sorting and fresh data
                await loadLabs();
                setNewLabName(''); // Clear the input field
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
                // Reload labs from backend to ensure proper sorting and fresh data
                await loadLabs();
            } else {
                alert(response.message || 'Failed to delete lab');
            }
        } catch (err) {
            console.error('Error deleting lab:', err);
            alert('An error occurred while deleting the lab');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen p-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-6">Lab List</h1>
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        <p className="mt-2">Loading labs...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen p-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl font-bold mb-6">Lab List</h1>
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Lab List</h1>
                
                {/* Existing labs list */}
                {labs.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No labs available.</p>
                    </div>
                ) : (
                    <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
                        <ul className="divide-y divide-gray-200">
                            {labs.map((lab) => (
                                <li key={lab.uid} className="flex items-center justify-between">
                                    <Link href={`/instructor/edit_lab/${lab.uid}`} className="flex-grow hover:bg-gray-50">
                                        <div className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between">
                                                <p className="text-lg font-medium text-indigo-600 truncate">
                                                    {lab.title}
                                                </p>
                                                <div className="ml-2 flex-shrink-0 flex">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                                        Edit
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                    <div className="px-4">
                                        <button
                                            onClick={() => handleDeleteLab(lab.uid, lab.title)}
                                            className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                            aria-label={`Delete ${lab.title}`}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Create new lab form */}
                <div className="bg-white shadow sm:rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-gray-800 mb-4">Create New Lab</h2>
                    <form onSubmit={handleCreateLab} className="flex gap-4">
                        <div className="flex-grow">
                            <label htmlFor="labName" className="block text-sm font-medium text-gray-700 mb-1">
                                Lab Name
                            </label>
                            <input
                                type="text"
                                id="labName"
                                value={newLabName}
                                onChange={(e) => setNewLabName(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-indigo-600 font-medium"
                                placeholder="Enter lab name"
                                disabled={creating}
                            />
                        </div>
                        <div className="flex items-end">
                            <button
                                type="submit"
                                disabled={creating || !newLabName.trim()}
                                className={`px-6 py-2 rounded-md text-white font-medium ${
                                    creating || !newLabName.trim()
                                        ? 'bg-gray-400 cursor-not-allowed'
                                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                                }`}
                            >
                                {creating ? 'Creating...' : 'Create Lab'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
