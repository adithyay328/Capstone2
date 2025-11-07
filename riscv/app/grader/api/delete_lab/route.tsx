import { NextRequest } from "next/server";
import { DeleteLabRequestSchema, DeleteLabResponseSchema } from "./types";
import { get_sql_client } from "@/app/sql";

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const requestBody = await request.json();
    const validatedRequest = DeleteLabRequestSchema.parse(requestBody);

    // Connect to database
    const client = get_sql_client();
    await client.connect();

    try {
      // Delete lab record
      const result = await client.query({
        text: 'DELETE FROM labs WHERE id = $1',
        values: [validatedRequest.id]
      });

      // Check if any rows were affected (success = true if lab existed and was deleted)
      const success = result.rowCount > 0;

      // Create and validate response
      const response = { success };
      const validatedResponse = DeleteLabResponseSchema.parse(response);

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
    console.error('Error in delete_lab API:', error);
    
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
