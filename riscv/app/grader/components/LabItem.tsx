"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getLab } from "../api/get_lab/frontend";
import { deleteLab } from "../api/delete_lab/frontend";

interface LabItemProps {
  labId: string;
  onDelete: (labId: string) => void;
}

export function LabItem({ labId, onDelete }: LabItemProps) {
  const [title, setTitle] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    async function fetchLabDetails() {
      try {
        setLoading(true);
        const response = await getLab({ id: labId });
        setTitle(response.title);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch lab details:", err);
        setError("Failed to load lab");
      } finally {
        setLoading(false);
      }
    }

    fetchLabDetails();
  }, [labId]);

  async function handleDelete() {
    try {
      setDeleting(true);
      const response = await deleteLab({ id: labId });
      
      if (response.success) {
        // Call the parent's callback to remove this lab from the list
        onDelete(labId);
      } else {
        alert("Failed to delete lab");
      }
    } catch (error) {
      console.error("Failed to delete lab:", error);
      alert("Error deleting lab");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <div>Loading lab {labId}...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <Link href={`/grader/lab/${labId}`}>
        <h1 style={{ display: "inline-block", marginRight: "10px", cursor: "pointer", color: "blue", textDecoration: "underline" }}>
          {labId} - {title}
        </h1>
      </Link>
      <button onClick={handleDelete} disabled={deleting}>
        {deleting ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}
