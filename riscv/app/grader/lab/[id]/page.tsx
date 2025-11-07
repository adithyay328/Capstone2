"use client";

import { useEffect, useState } from "react";
import { getLab } from "../../api/get_lab/frontend";
import { editLab } from "../../api/edit_lab/frontend";

interface LabDetailPageProps {
  params: {
    id: string;
  };
}

export default function LabDetailPage({ params }: LabDetailPageProps) {
  const [title, setTitle] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch lab data on mount
  useEffect(() => {
    async function fetchLab() {
      try {
        setLoading(true);
        const response = await getLab({ id: params.id });
        setTitle(response.title);
        setError(null);
      } catch (err) {
        console.error("Error fetching lab:", err);
        setError("Failed to load lab");
      } finally {
        setLoading(false);
      }
    }

    fetchLab();
  }, [params.id]);

  // Handle title change and save to backend
  async function handleTitleChange(newTitle: string) {
    setTitle(newTitle);
    
    try {
      await editLab({
        id: params.id,
        title: newTitle
      });
    } catch (err) {
      console.error("Error updating lab title:", err);
      setError("Failed to update title");
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <p>Loading lab...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Lab ID:</label>
        <p className="text-gray-600">{params.id}</p>
      </div>

      <div className="mb-4">
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          Title:
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter lab title"
        />
      </div>
    </div>
  );
}
