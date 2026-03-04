import { NextRequest } from 'next/server';
import { verifyCookieInternal } from '@/app/verify/internal';
import { DBConnection } from '@/app/sql/sql';

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') || '';
  const verifyResponse = await verifyCookieInternal(cookieHeader);

  if (!verifyResponse.data?.username || verifyResponse.data.student !== false) {
    return new Response(
      JSON.stringify({ success: false, message: 'Only instructors can list course members' }),
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
    db = new DBConnection();
    const result = await db.client.query(
      `SELECT username, role, status FROM course_memberships WHERE course_id = $1 ORDER BY role, username`,
      [courseId]
    );
    return new Response(
      JSON.stringify({ success: true, members: result.rows }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Course members error:', error);
    return new Response(
      JSON.stringify({ success: false, message: error.message || 'Failed to list members' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  } finally {
    if (db) {
      try {
        await db.client.end();
      } catch (e) {
        console.error('Error closing db:', e);
      }
    }
  }
}
