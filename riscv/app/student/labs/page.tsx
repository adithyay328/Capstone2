'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { listLabs } from '@/app/api/list_labs/frontend';
import { Lab } from '@/app/api/list_labs/types';
import Link from 'next/link';
import Sidebar from '@/components/sidebar';

export default function StudentLabsPage() {
    const router = useRouter();
    const [labs, setLabs] = useState<Lab[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleNewProject = useCallback(() => {
        router.push('/student/new-project');
    }, [router]);

    const handleOpenProjects = useCallback(() => {
        router.push('/student/projects');
    }, [router]);

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

    return (
        <div className="min-h-screen bg-[rgb(82,82,82)] text-zinc-100 flex">
            <Sidebar
                initialOpen={false}
                onNewProject={handleNewProject}
                onOpenProjects={handleOpenProjects}
            />
            <main className="flex-1 relative px-4 sm:px-6 md:pl-23">
                <div className="max-w-4xl mx-auto pt-8">
                    <div className="flex items-center mb-6">
                        <h1 className="text-3xl font-bold">Available Labs</h1>
                    </div>

                    {loading ? (
                        <div className="text-center py-8">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-200"></div>
                            <p className="mt-2 text-zinc-300">Loading labs...</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <strong className="font-bold">Error: </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    ) : labs.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-zinc-300">No labs available.</p>
                        </div>
                    ) : (
                        <div className="bg-white shadow overflow-hidden sm:rounded-md">
                            <ul className="divide-y divide-gray-200">
                                {labs.map((lab) => (
                                    <li key={lab.uid}>
                                        <Link href={`/student/labs-root?lab=${lab.uid}`} className="block hover:bg-gray-50">
                                            <div className="px-4 py-4 sm:px-6">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-lg font-medium text-indigo-600 truncate">
                                                        {lab.title}
                                                    </p>
                                                    <div className="ml-2 flex-shrink-0 flex">
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                                            Select
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
            </main>
        </div>
    );
}
