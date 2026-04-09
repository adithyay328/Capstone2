import { NextRequest } from 'next/server';
import { verifyCookieInternal } from '@/app/verify/internal';
import { DBConnection } from '@/app/sql/sql';
import {
  getAssignedCourseLabTitle,
  getCourseLabRosterGradeRows,
  hasStaffCourseAccess,
} from '@/app/api/course_lab_roster_grades/data';

function escapeCsvCell(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

function formatGradeForCsv(grade: number): string {
  return Number.isInteger(grade) ? String(grade) : grade.toFixed(2);
}

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get('cookie') || '';
  const verifyResponse = await verifyCookieInternal(cookieHeader);

  if (!verifyResponse.data?.username || verifyResponse.data.student !== false) {
    return new Response('Only course staff can export roster grades', { status: 403 });
  }

  const courseId = req.nextUrl.searchParams.get('course_id')?.trim() ?? '';
  const labUid = req.nextUrl.searchParams.get('lab_uid')?.trim() ?? '';

  if (!/^[0-9]{5}$/.test(courseId) || !labUid) {
    return new Response('Valid course_id and lab_uid are required', { status: 400 });
  }

  let db: DBConnection | null = null;

  try {
    db = await DBConnection.create();
    const viewerUsername = String(verifyResponse.data.username);
    const client = db.client;

    const hasAccess = await hasStaffCourseAccess(client, viewerUsername, courseId);
    if (!hasAccess) {
      return new Response('You are not assigned to this course', { status: 403 });
    }

    const labTitle = await getAssignedCourseLabTitle(client, courseId, labUid);
    if (!labTitle) {
      return new Response('This lab is not assigned to the selected course', { status: 404 });
    }

    const members = await getCourseLabRosterGradeRows(client, courseId, labUid);

    const lines = [
      ['asuid', 'name', 'lab', 'grade_received'].join(','),
      ...members.map((member) =>
        [
          escapeCsvCell(member.asuid),
          escapeCsvCell(member.name),
          escapeCsvCell(labTitle),
          formatGradeForCsv(member.grade),
        ].join(',')
      ),
    ];

    return new Response(lines.join('\r\n'), {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="course-${courseId}-lab-${labUid}-roster-grades.csv"`,
      },
    });
  } catch (error: unknown) {
    console.error('course_lab_roster_grades_csv GET:', error);
    return new Response(
      error instanceof Error ? error.message : 'Failed to export roster grades CSV',
      { status: 500 }
    );
  } finally {
    if (db) {
      try {
        await db.client.end();
      } catch {
        // ignore
      }
    }
  }
}
