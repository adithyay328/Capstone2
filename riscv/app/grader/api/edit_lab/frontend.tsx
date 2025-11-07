"use client";

import { EditLabRequest, EditLabRequestSchema, EditLabResponse, EditLabResponseSchema } from "./types";

export async function editLab(request: EditLabRequest): Promise<EditLabResponse> {
  // Validate request
  const validatedRequest = EditLabRequestSchema.parse(request);

  try {
    const response = await fetch('/grader/api/edit_lab', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedRequest),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseBody = await response.json();
    const validatedResponse = EditLabResponseSchema.parse(responseBody);
    
    return validatedResponse;
  } catch (error) {
    console.error('Error calling editLab API:', error);
    throw error;
  }
}
