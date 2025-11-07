import { NextRequest } from "next/server";
import { CreateLabRequestSchema, CreateLabResponseSchema } from "./types";
import { get_sql_client } from "@/app/sql";
import { createUID } from "@/app/uid";

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const requestBody = await request.json();
    const validatedRequest = CreateLabRequestSchema.parse(requestBody);

    // Generate new UID for the lab
    const newLabId = createUID();

    // Connect to database
    const client = get_sql_client();
    await client.connect();

    try {
      // Insert new lab record
      const result = await client.query({
        text: 'INSERT INTO labs (id, title) VALUES ($1, $2)',
        values: [newLabId, validatedRequest.title]
      });

      // Check if row was inserted successfully
      const success = result.rowCount > 0;

      // Create and validate response
      const response = { success };
      const validatedResponse = CreateLabResponseSchema.parse(response);

      return new Response(
        JSON.stringify(validatedResponse),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    } finally {
      // Close database connection
      await client.end();
    }
  } catch (error: any) {
    console.error('Error in create_lab API:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        success: false
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
