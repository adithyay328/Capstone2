'use client';

import { useState, useEffect } from 'react';
import { listLabs } from '@/app/api/list_labs/frontend';
import { Lab } from '@/app/api/list_labs/types';
import Link from 'next/link';

export default function StudentLabsPage() {
    const [labs, setLabs] = useState<Lab[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    if (loading) {
        return (
            <div className="min-h-screen p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-3xl font-bold">Available Labs</h1>
                        <Link 
                            href="/student/labs-root" 
                            className="text-blue-600 hover:text-blue-800"
                        >
                            ← Back to Simulator
                        </Link>
                    </div>
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
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-3xl font-bold">Available Labs</h1>
                        <Link 
                            href="/student/labs-root" 
                            className="text-blue-600 hover:text-blue-800"
                        >
                            ← Back to Simulator
                        </Link>
                    </div>
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
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold">Available Labs</h1>
                    <Link 
                        href="/student/labs-root" 
                        className="text-blue-600 hover:text-blue-800"
                    >
                        ← Back to Simulator
                    </Link>
                </div>
                
                {labs.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No labs available.</p>
                    </div>
                ) : (
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {labs.map((lab) => (
                                <li key={lab.uid}>
                                    <Link href={`/student/labs/${lab.uid}`} className="block hover:bg-gray-50">
                                        <div className="px-4 py-4 sm:px-6">
                                            <div className="flex items-center justify-between">
                                                <p className="text-lg font-medium text-indigo-600 truncate">
                                                    {lab.title}
                                                </p>
                                                <div className="ml-2 flex-shrink-0 flex">
                                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                                        View
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
