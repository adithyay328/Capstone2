import { NextRequest } from 'next/server';
import { LoginRequestSchema } from './types';
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
    const portal = parsedBody.data.portal ?? 'student';

    // Get database connection
    db = await DBConnection.create();
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

    let hasActiveTaRole = false;
    try {
      const taRoleResult = await client.query(
        `
        SELECT 1
        FROM course_memberships
        WHERE username = $1
          AND role = $2
          AND status = 'active'
        LIMIT 1
        `,
        [username, 'ta']
      );
      hasActiveTaRole = taRoleResult.rows.length > 0;
    } catch (taLookupError) {
      // Keep login backwards compatible if course role tables are not present yet.
      console.warn('TA role lookup skipped:', taLookupError);
    }

    // Verify password using Argon2id
    const isValid = await verifyPassword(password, storedHash);

    if (isValid) {
      const isInstructor = Boolean(user.instructor);
      const isTa = !isInstructor && hasActiveTaRole;
      const isStudent = !isInstructor && !isTa;

      const isPortalAllowed =
        (portal === 'student' && isStudent) ||
        (portal === 'admin' && (isInstructor || isTa));

      if (!isPortalAllowed) {
        const modifiedCookie = await modifyCookieData({});
        const message =
          portal === 'student'
            ? 'This account must sign in using Admin Login'
            : 'This account must sign in using Student Login';

        return new Response(
          JSON.stringify({
            success: false,
            message,
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

      // Login successful - create authenticated cookie
      try {
        const userData = {
          username: user.username,
          student: isStudent,
          instructor: isInstructor,
          ta: isTa,
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
            instructor: userData.instructor,
            ta: userData.ta,
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
            student: !user.instructor && !hasActiveTaRole,
            instructor: Boolean(user.instructor),
            ta: !user.instructor && hasActiveTaRole,
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
  } catch (error: unknown) {
    console.error('Login error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const message =
      process.env.NODE_ENV === 'development'
        ? `Backend error: ${errorMessage}`
        : 'Unknown error in backend';

    // Make an empty cookie to clear any existing cookies
    const modifiedCookie = await modifyCookieData({});

    return new Response(
      JSON.stringify({
        success: false,
        message,
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
