import { NextRequest } from "next/server";
import { ListLabsRequestSchema, ListLabsResponseSchema } from "./types";
import { get_sql_client } from "@/app/sql";

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const requestBody = await request.json();
    const validatedRequest = ListLabsRequestSchema.parse(requestBody);

    // Connect to database
    const client = get_sql_client();
    await client.connect();

    try {
      // Query for all lab IDs
      const result = await client.query({
        text: 'SELECT id FROM labs ORDER BY id',
        values: []
      });

      // Extract lab IDs from results
      const labIds = result.rows.map((row: { id: string }) => row.id);

      // Create and validate response
      const response: any = { labIds };
      const validatedResponse = ListLabsResponseSchema.parse(response);

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
    console.error('Error in list_labs API:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        labIds: [] 
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
