import { NextRequest } from 'next/server';
import { DBConnection } from '@/app/sql/sql';
import { VerifyRequestSchema, VerifyResponseSchema, ErrorResponseSchema } from './types';
import crypto from 'crypto';

// POST-only endpoint for verification
export async function POST(req: NextRequest) {
  let db: DBConnection | null = null;
  
  try {
    // Parse and validate the request body
    const body = await req.json();
    const parsedBody = VerifyRequestSchema.safeParse(body);
    
    if (!parsedBody.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation Error',
          message: 'Invalid request format',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { cookie } = parsedBody.data;

    // Extract sens object from cookie
    let sensData: any = null;
    let cookieWithoutSens = cookie;
    
    try {
      // Look for sens= in the cookie string
      const sensMatch = cookie.match(/sens=([^;]*)/);
      if (sensMatch) {
        const sensString = decodeURIComponent(sensMatch[1]);
        sensData = JSON.parse(sensString);
        
        // Remove sens from cookie for failure case
        cookieWithoutSens = cookie.replace(/sens=[^;]*;?\s*/, '');
        // Clean up any trailing semicolons
        cookieWithoutSens = cookieWithoutSens.replace(/;\s*$/, '');
      }
    } catch (parseError) {
      // If parsing fails, treat as verification failure
      sensData = null;
    }

    // If no sens data found, return failure response
    if (!sensData) {
      return new Response(
        JSON.stringify({
          cookie: cookieWithoutSens,
          data: null,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verify HMAC
    try {
      const { hmac, data } = sensData;
      
      // Get database connection and secret for HMAC verification
      db = new DBConnection();
      const client = db.client;
      const secretResult = await client.query(
        "SELECT value FROM secrets WHERE name = 'hmac'"
      );
      
      if (secretResult.rows.length === 0) {
        return new Response(
          JSON.stringify({
            error: 'Internal Server Error',
            message: 'HMAC secret not found in database',
          }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const secret = secretResult.rows[0].value;

      // Create HMAC hash of the data
      const dataString = JSON.stringify(data);
      const expectedHmac = crypto
        .createHmac('sha256', secret)
        .update(dataString)
        .digest('hex');

      // Compare HMACs using timing-safe comparison
      const isValid = crypto.timingSafeEqual(
        Buffer.from(hmac, 'hex'),
        Buffer.from(expectedHmac, 'hex')
      );

      if (isValid) {
        // Verification successful - return same cookie and data
        return new Response(
          JSON.stringify({
            cookie: cookie,
            data: data,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      } else {
        // HMAC verification failed - return cookie without sens
        return new Response(
          JSON.stringify({
            cookie: cookieWithoutSens,
            data: null,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    } catch (verificationError) {
      // Verification process failed - return cookie without sens
      return new Response(
        JSON.stringify({
          cookie: cookieWithoutSens,
          data: null,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error: any) {
    console.error('Verification API error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred during verification: ' + (error.message || 'Unknown error'),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } finally {
    // Explicitly close database connection
    if (db) {
      try {
        await db.client.end();
      } catch (closeError) {
        console.error('Error closing database connection:', closeError);
      }
    }
  }
}

// Disable unsupported methods
export async function GET() {
  return new Response('Method Not Allowed', { status: 405 });
}

export async function PUT() {
  return new Response('Method Not Allowed', { status: 405 });
}

export async function DELETE() {
  return new Response('Method Not Allowed', { status: 405 });
}

export async function PATCH() {
  return new Response('Method Not Allowed', { status: 405 });
}
