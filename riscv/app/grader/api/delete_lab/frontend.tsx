"use client";

import { DeleteLabRequest, DeleteLabRequestSchema, DeleteLabResponse, DeleteLabResponseSchema } from "./types";

export async function deleteLab(request: DeleteLabRequest): Promise<DeleteLabResponse> {
  // Validate request
  const validatedRequest = DeleteLabRequestSchema.parse(request);

  try {
    const response = await fetch('/grader/api/delete_lab', {
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
    const validatedResponse = DeleteLabResponseSchema.parse(responseBody);
    
    return validatedResponse;
  } catch (error) {
    console.error('Error calling deleteLab API:', error);
    throw error;
  }
}
