"use client";

import { CreateLabRequest, CreateLabRequestSchema, CreateLabResponse, CreateLabResponseSchema } from "./types";

export async function createLab(request: CreateLabRequest): Promise<CreateLabResponse> {
  // Validate request
  const validatedRequest = CreateLabRequestSchema.parse(request);

  try {
    const response = await fetch('/grader/api/create_lab', {
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
    const validatedResponse = CreateLabResponseSchema.parse(responseBody);
    
    return validatedResponse;
  } catch (error) {
    console.error('Error calling createLab API:', error);
    throw error;
  }
}
