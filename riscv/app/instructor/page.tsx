'use client';

import { useState, useEffect } from 'react';
import { listLabs } from '@/app/api/list_labs/frontend';
import { Lab } from '@/app/api/list_labs/types';

export default function InstructorPage() {
    const [labs, setLabs] = useState<Lab[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchLabs = async () => {
            try {
                setLoading(true);
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

        fetchLabs();
    }, []);

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
                {labs.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No labs available.</p>
                    </div>
                ) : (
                    <div className="bg-white shadow overflow-hidden sm:rounded-md">
                        <ul className="divide-y divide-gray-200">
                            {labs.map((lab) => (
                                <li key={lab.uid}>
                                    <div className="px-4 py-4 sm:px-6">
                                        <div className="flex items-center justify-between">
                                            <p className="text-lg font-medium text-indigo-600 truncate">
                                                {lab.title}
                                            </p>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
