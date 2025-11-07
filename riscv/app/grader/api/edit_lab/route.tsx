import { NextRequest } from "next/server";
import { EditLabRequestSchema, EditLabResponseSchema } from "./types";
import { get_sql_client } from "@/app/sql";

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const requestBody = await request.json();
    const validatedRequest = EditLabRequestSchema.parse(requestBody);

    // Connect to database
    const client = get_sql_client();
    await client.connect();

    try {
      // Update lab record
      const result = await client.query({
        text: 'UPDATE labs SET title = $1 WHERE id = $2',
        values: [validatedRequest.title, validatedRequest.id]
      });

      // Check if any rows were affected
      const success = result.rowCount > 0;

      // Create and validate response
      const response = { success };
      const validatedResponse = EditLabResponseSchema.parse(response);

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
    console.error('Error in edit_lab API:', error);
    
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
