import { NextRequest } from 'next/server';
import { verifyCookieInternal } from '@/app/verify/internal';
import { DBConnection } from '@/app/sql/sql';

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') || '';
  const verifyResponse = await verifyCookieInternal(cookieHeader);

  if (!verifyResponse.data?.username || verifyResponse.data.student !== false) {
    return new Response(
      JSON.stringify({ success: false, message: 'Only course staff can list course members' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const courseId = req.nextUrl.searchParams.get('course_id');
  if (!courseId || !/^[0-9]{5}$/.test(courseId)) {
    return new Response(
      JSON.stringify({ success: false, message: 'Valid course_id (5 digits) required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let db: DBConnection | null = null;
  try {
    db = await DBConnection.create();
    const username = String(verifyResponse.data.username);
    const membershipResult = await db.client.query(
      `SELECT 1
       FROM course_memberships
       WHERE course_id = $1
         AND username = $2
         AND role IN ('instructor', 'ta')
         AND status = 'active'
       LIMIT 1`,
      [courseId, username]
    );
    if (membershipResult.rows.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'You are not assigned to this course' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const result = await db.client.query(
      `SELECT username, role, status FROM course_memberships WHERE course_id = $1 ORDER BY role, username`,
      [courseId]
    );
    return new Response(
      JSON.stringify({ success: true, members: result.rows }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Course members error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to list members',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    if (db) {
      try {
        await db.client.end();
      } catch (closeError) {
        console.error('Error closing db:', closeError);
      }
    }
  }
}
