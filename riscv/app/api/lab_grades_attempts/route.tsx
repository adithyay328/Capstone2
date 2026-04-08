import { NextRequest } from "next/server";
import { verifyCookieInternal } from "@/app/verify/internal";
import { DBConnection } from "@/app/sql/sql";
import { z } from "zod";
import { type LabGradesAttemptsResponse } from "./types";

const AttemptsQuerySchema = z.object({
  course_id: z.string().min(1),
  lab_uid: z.string().min(1),
  username: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  const verifyResponse = await verifyCookieInternal(cookieHeader);

  if (!verifyResponse.data?.username || verifyResponse.data.student !== false) {
    return new Response(
      JSON.stringify({ success: false, message: "Only instructors can view lab attempts" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  const search = req.nextUrl.searchParams;
  const parsedQuery = AttemptsQuerySchema.safeParse({
    course_id: search.get("course_id") ?? "",
    lab_uid: search.get("lab_uid") ?? "",
    username: search.get("username") ?? "",
  });

  if (!parsedQuery.success) {
    return new Response(
      JSON.stringify({ success: false, message: "course_id, lab_uid, username are required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { course_id, lab_uid, username } = parsedQuery.data;
  const courseId = String(course_id);
  const labUid = String(lab_uid);
  const studentUsername = String(username);

  let db: DBConnection | null = null;
  try {
    db = await DBConnection.create();
    const client = db.client;

    // Ensure lab assigned to this course
    const assignedRes = await client.query(
      `SELECT 1
       FROM course_labs
       WHERE course_id = $1 AND lab_uid = $2`,
      [courseId, labUid]
    );
    if (assignedRes.rows.length === 0) {
      return new Response(
        JSON.stringify({ success: false, message: "Lab not assigned to this course" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Total tests (points per test = 10)
    const testCountRes = await client.query(
      `SELECT COUNT(*)::int AS n FROM test_cases WHERE lab_uid = $1`,
      [labUid]
    );
    const testCaseCount = testCountRes.rows[0]?.n ?? 0;
    const maxScore = testCaseCount * 10;

    if (testCaseCount === 0) {
      const response: LabGradesAttemptsResponse = {
        success: true,
        labUid,
        memberUsername: studentUsername,
        testCaseCount,
        maxScore,
        attempts: [],
      };
      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const tablesRes = await client.query(
      `SELECT
         (to_regclass('public.grade_attempt_sessions') IS NOT NULL) AS has_sessions,
         (to_regclass('public.grade_test_case_results') IS NOT NULL) AS has_results`
    );
    const hasSessions = !!tablesRes.rows[0]?.has_sessions;
    const hasResults = !!tablesRes.rows[0]?.has_results;

    let attempts: LabGradesAttemptsResponse["attempts"] = [];

    if (hasSessions && hasResults) {
      const attemptsRes = await client.query(
        `
        WITH tc AS (
          SELECT COUNT(*)::int AS n FROM test_cases WHERE lab_uid = $1
        ),
        sess AS (
          SELECT
            gas.grade_session_id,
            gas.created_at,
            SUM(CASE WHEN gtc.pass THEN 1 ELSE 0 END)::int AS passed_tests,
            COUNT(*)::int AS result_rows,
            tc.n AS total_tests
          FROM grade_attempt_sessions gas
          JOIN grade_test_case_results gtc
            ON gtc.username = gas.username
           AND gtc.lab_uid = gas.lab_uid
           AND gtc.grade_session_id = gas.grade_session_id
          CROSS JOIN tc
          WHERE gas.lab_uid = $1
            AND gas.username = $2
          GROUP BY gas.grade_session_id, gas.created_at, tc.n
        ),
        complete AS (
          SELECT
            grade_session_id,
            created_at,
            passed_tests,
            total_tests,
            (passed_tests * 10)::int AS score
          FROM sess
          WHERE result_rows = total_tests
        )
        SELECT
          ROW_NUMBER() OVER (ORDER BY created_at ASC)::int AS attempt_number,
          grade_session_id,
          created_at,
          passed_tests,
          score,
          total_tests
        FROM complete
        ORDER BY created_at DESC;
        `,
        [labUid, studentUsername]
      );

      attempts = attemptsRes.rows.map((r: any) => ({
        attemptNumber: r.attempt_number,
        gradeSessionId: r.grade_session_id,
        gradedAt: r.created_at instanceof Date ? r.created_at.toISOString() : String(r.created_at),
        passedTests: r.passed_tests,
        score: r.score,
        maxScore,
        totalTests: r.total_tests,
      }));
    }

    const response: LabGradesAttemptsResponse = {
      success: true,
      labUid,
      memberUsername: studentUsername,
      testCaseCount,
      maxScore,
      attempts,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("lab_grades_attempts error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: error?.message || "Failed to load attempts history",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
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

