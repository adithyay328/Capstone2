import { NextRequest } from 'next/server';
import { LoginRequestSchema, LoginResponseSchema, ErrorResponseSchema } from './types';
import { DBConnection } from '@/app/sql/sql';
import { verifyPassword } from '@/app/passwords';
import { modifyCookieData } from '@/app/verify/modify';

export async function POST(req: NextRequest) {
  let db: DBConnection | null = null;
  
  try {
    // Parse and validate request body
    const body = await req.json();
    const parsedBody = LoginRequestSchema.safeParse(body);
    
    if (!parsedBody.success) {
      // Invalid request format. Use modifyCookieData with empty object to clear cookie
      const modifiedCookie = await modifyCookieData({});

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid request format',
        }),
        {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Set-Cookie': modifiedCookie,
          },
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
      // Username not found. Use modifyCookieData with empty object to clear cookie
      const modifiedCookie = await modifyCookieData({});

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Username not found',
        }),
        {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Set-Cookie': modifiedCookie,
          },
        }
      );
    }

    const user = userResult.rows[0];
    const { password_hash: storedHash } = user;

    // Verify password using Argon2id
    const isValid = await verifyPassword(password, storedHash);

    if (isValid) {
      // Login successful - create authenticated cookie
      try {
        const userData = {
          username: user.username,
          student: !user.instructor, // student is the inverse of instructor
        };

        // Create a new cookie with the user data
        const newCookie = await modifyCookieData(userData);
        console.log('Created new cookie for user:', newCookie);

        // Return success response with cookie and student info
        return new Response(
          JSON.stringify({
            username: user.username,
            success: true,
            student: userData.student,
          }),
          {
            status: 200,
            headers: { 
              'Content-Type': 'application/json',
              'Set-Cookie': newCookie,
            },
          }
        );
      } catch (cookieError) {
        console.error('Error creating auth cookie:', cookieError);
        // Fall back to basic success response if cookie creation fails
        // Use modifyCookieData with empty object to clear cookie as fallback
        const modifiedCookie = await modifyCookieData({});

        return new Response(
          JSON.stringify({
            username: user.username,
            success: true,
            student: !user.instructor,
          }),
          {
            status: 200,
            headers: { 
              'Content-Type': 'application/json',
              'Set-Cookie': modifiedCookie,
            },
          }
        );
      }
    } else {
      // Invalid password. Use modify
      // cookie with an empty object to clear
      const modifiedCookie = await modifyCookieData({});

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Incorrect password',
        }),
        {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Set-Cookie': modifiedCookie,
          },
        }
      );
    }
  } catch (error: any) {
    console.error('Login error:', error);

    // Make an empty cookie to clear any existing cookies
    const modifiedCookie = await modifyCookieData({});

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Unknown error in backend',
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Set-Cookie': modifiedCookie,
        },
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
