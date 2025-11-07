"use client";

import { ListLabsRequest, ListLabsRequestSchema, ListLabsResponse, ListLabsResponseSchema } from "./types";

export async function listLabs(request: ListLabsRequest): Promise<ListLabsResponse> {
  // Validate request
  const validatedRequest = ListLabsRequestSchema.parse(request);

  try {
    const response = await fetch('/grader/api/list_labs', {
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
    const validatedResponse = ListLabsResponseSchema.parse(responseBody);
    
    return validatedResponse;
  } catch (error) {
    console.error('Error calling listLabs API:', error);
    throw error;
  }
}
