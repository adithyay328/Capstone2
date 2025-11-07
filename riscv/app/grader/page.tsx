"use client";

import { useEffect, useState } from "react";
import { listLabs } from "./api/list_labs/frontend";
import { createLab } from "./api/create_lab/frontend";
import { LabItem } from "./components/LabItem";

export default function GraderPage() {
  const [labIds, setLabIds] = useState<string[]>([]);
  const [newLabTitle, setNewLabTitle] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);

  // Fetch all lab IDs on mount
  useEffect(() => {
    async function fetchLabs() {
      try {
        setLoading(true);
        const response = await listLabs({});
        setLabIds(response.labIds);
      } catch (error) {
        console.error("Failed to fetch labs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchLabs();
  }, []);

  // Handle creating a new lab
  async function handleCreateLab() {
    if (!newLabTitle.trim()) {
      alert("Please enter a lab title");
      return;
    }

    try {
      setCreating(true);
      const response = await createLab({ title: newLabTitle });
      
      if (response.success) {
        // Refetch the lab list to get the new lab ID
        const updatedLabs = await listLabs({});
        setLabIds(updatedLabs.labIds);
        setNewLabTitle(""); // Clear the input
      } else {
        alert("Failed to create lab");
      }
    } catch (error) {
      console.error("Failed to create lab:", error);
      alert("Error creating lab");
    } finally {
      setCreating(false);
    }
  }

  // Handle deleting a lab
  function handleDeleteLab(labId: string) {
    // Filter out the deleted lab ID from the current list
    const updatedLabIds = labIds.filter(id => id !== labId);
    setLabIds(updatedLabIds);
  }

  if (loading) {
    return <div>Loading labs...</div>;
  }

  return (
    <div>
      <h1>Grader Page</h1>
      
      {/* Form to create new lab */}
      <div style={{ marginBottom: "20px" }}>
        <input
          type="text"
          value={newLabTitle}
          onChange={(e) => setNewLabTitle(e.target.value)}
          placeholder="Enter lab title"
          disabled={creating}
        />
        <button onClick={handleCreateLab} disabled={creating}>
          {creating ? "Creating..." : "Create Lab"}
        </button>
      </div>

      {/* List of labs */}
      <div>
        <h2>Labs:</h2>
        {labIds.length === 0 ? (
          <p>No labs found</p>
        ) : (
          <ul>
            {labIds.map((labId) => (
              <li key={labId}>
                <LabItem labId={labId} onDelete={handleDeleteLab} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
