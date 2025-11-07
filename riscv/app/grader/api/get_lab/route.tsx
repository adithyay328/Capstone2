import { NextRequest } from "next/server";
import { GetLabRequestSchema, GetLabResponseSchema } from "./types";
import { get_sql_client } from "@/app/sql";

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const requestBody = await request.json();
    const validatedRequest = GetLabRequestSchema.parse(requestBody);

    // Connect to database
    const client = get_sql_client();
    await client.connect();

    try {
      // Query for lab details
      const result = await client.query({
        text: 'SELECT id, title FROM labs WHERE id = $1',
        values: [validatedRequest.id]
      });

      // Check if lab was found
      if (result.rows.length === 0) {
        return new Response(
          JSON.stringify({ 
            error: 'Lab not found'
          }),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Create and validate response
      const response = {
        id: result.rows[0].id,
        title: result.rows[0].title
      };
      const validatedResponse = GetLabResponseSchema.parse(response);

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
    console.error('Error in get_lab API:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error'
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
