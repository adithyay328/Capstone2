import { NextRequest } from 'next/server';
import { verifyCookieInternal } from '@/app/verify/internal';
import { DBConnection } from '@/app/sql/sql';
import { AddCourseMemberRequestSchema } from './types';

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') || '';
  const verifyResponse = await verifyCookieInternal(cookieHeader);

  if (!verifyResponse.data?.username || verifyResponse.data.student !== false) {
    return new Response(
      JSON.stringify({ success: false, message: 'Only instructors can add course members' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, message: 'Invalid request body' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const parsed = AddCourseMemberRequestSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ success: false, message: 'Invalid payload; role must be student, instructor, or ta' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const { course_id, username, role } = parsed.data;
  const addedBy = verifyResponse.data.username as string;
  let db: DBConnection | null = null;

  try {
    db = new DBConnection();
    const client = db.client;

    const courseCheck = await client.query('SELECT 1 FROM courses WHERE course_id = $1', [course_id]);
    if (courseCheck.rows.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'Course not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    const userCheck = await client.query('SELECT 1 FROM users WHERE username = $1', [username]);
    if (userCheck.rows.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    await client.query(
      `INSERT INTO course_memberships (course_id, username, role, status, added_by)
       VALUES ($1, $2, $3, 'active', $4)
       ON CONFLICT (course_id, username) DO UPDATE SET role = $3, status = 'active'`,
      [course_id, username, role, addedBy]
    );

    return new Response(
      JSON.stringify({ success: true, message: 'Member added' }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Add course member error:', error);
    return new Response(
      JSON.stringify({ success: false, message: error.message || 'Failed to add member' }),
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
