import { NextRequest } from 'next/server';
import { LoginRequestSchema, LoginResponseSchema, ErrorResponseSchema } from './types';
import { DBConnection } from '@/app/sql/sql';
import { verifyPassword } from '@/app/passwords';

export async function POST(req: NextRequest) {
  let db: DBConnection | null = null;
  
  try {
    // Parse and validate request body
    const body = await req.json();
    const parsedBody = LoginRequestSchema.safeParse(body);
    
    if (!parsedBody.success) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid request format',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { username, password } = parsedBody.data;

    // Get database connection
    db = new DBConnection();
    const client = db.client;

    // Get user from database
    const userResult = await client.query(
      "SELECT username, salt, password_hash, instructor FROM users WHERE username = $1",
      [username]
    );

    if (userResult.rows.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Username not found',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const user = userResult.rows[0];
    const { password_hash: storedHash } = user;

    // Verify password using Argon2id
    const isValid = await verifyPassword(password, storedHash);

    if (isValid) {
      // Login successful
      return new Response(
        JSON.stringify({
          username: user.username,
          success: true,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } else {
      // Invalid password
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Incorrect password',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error: any) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Unknown error in backend',
      }),
      {
        status: 200,
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
