"use client";

import { GetLabRequest, GetLabRequestSchema, GetLabResponse, GetLabResponseSchema } from "./types";

export async function getLab(request: GetLabRequest): Promise<GetLabResponse> {
  // Validate request
  const validatedRequest = GetLabRequestSchema.parse(request);

  try {
    const response = await fetch('/grader/api/get_lab', {
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
    const validatedResponse = GetLabResponseSchema.parse(responseBody);
    
    return validatedResponse;
  } catch (error) {
    console.error('Error calling getLab API:', error);
    throw error;
  }
}
