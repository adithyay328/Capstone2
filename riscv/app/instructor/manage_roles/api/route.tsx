import { NextRequest } from "next/server";
import { verifyCookieInternal } from "@/app/verify/internal";
import { modifyCookieData } from "@/app/verify/modify";
import { DBConnection } from "@/app/sql/sql";
import {
  ManageRoleRequestSchema,
  ManageRoleResponse,
} from "./types";

type AuthData = {
  username?: string;
  instructor?: boolean;
};

export async function POST(req: NextRequest) {
  const cookieHeader = req.headers.get("cookie") || "";
  const verifyResponse = await verifyCookieInternal(cookieHeader);
  const authData = verifyResponse.data as AuthData | null;

  if (!authData || !authData.username || typeof authData.instructor === "undefined") {
    const modifiedCookie = await modifyCookieData({});
    return new Response(
      JSON.stringify({
        success: false,
        message: "Invalid or missing authentication",
      } satisfies ManageRoleResponse),
      {
        status: 401,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": modifiedCookie,
        },
      }
    );
  }

  if (authData.instructor !== true) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Only instructors can manage roles",
      } satisfies ManageRoleResponse),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Invalid request format",
      } satisfies ManageRoleResponse),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const parsedBody = ManageRoleRequestSchema.safeParse(body);
  if (!parsedBody.success) {
    return new Response(
      JSON.stringify({
        success: false,
        message: "Invalid request payload",
      } satisfies ManageRoleResponse),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const username = parsedBody.data.username;
  const courseId = parsedBody.data.courseId;
  const newRole = parsedBody.data.role;

  let db: DBConnection | null = null;

  try {
    db = new DBConnection();
    const client = db.client;

    const targetUserResult = await client.query(
      "SELECT instructor FROM users WHERE username = $1",
      [username]
    );
    if (targetUserResult.rows.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `User '${username}' does not exist`,
        } satisfies ManageRoleResponse),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (Boolean(targetUserResult.rows[0].instructor)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "This page only changes TA/student roles",
        } satisfies ManageRoleResponse),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    const courseResult = await client.query(
      "SELECT course_id FROM courses WHERE course_id = $1",
      [courseId]
    );
    if (courseResult.rows.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Course '${courseId}' does not exist`,
        } satisfies ManageRoleResponse),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const existingMembershipResult = await client.query(
      "SELECT role FROM course_memberships WHERE course_id = $1 AND username = $2",
      [courseId, username]
    );
    const previousRole =
      existingMembershipResult.rows.length > 0
        ? String(existingMembershipResult.rows[0].role)
        : null;

    if (previousRole === "instructor") {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Cannot change instructor course memberships on this page",
        } satisfies ManageRoleResponse),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }

    const upsertMembershipResult = await client.query(
      `
      INSERT INTO course_memberships (course_id, username, role, status, added_by, added_at)
      VALUES ($1, $2, $3, 'active', $4, now())
      ON CONFLICT (course_id, username)
      DO UPDATE SET
        role = EXCLUDED.role,
        status = 'active',
        added_by = EXCLUDED.added_by,
        added_at = now()
      RETURNING course_id, username, role
      `,
      [courseId, username, newRole, authData.username]
    );

    const updatedMembership = upsertMembershipResult.rows[0] as {
      course_id: string;
      username: string;
      role: string;
    };

    const message = previousRole
      ? `Updated ${updatedMembership.username} in course ${updatedMembership.course_id} from ${previousRole} to ${updatedMembership.role}.`
      : `Assigned ${updatedMembership.username} as ${updatedMembership.role} in course ${updatedMembership.course_id}.`;

    return new Response(
      JSON.stringify({
        success: true,
        message,
        membership: {
          username: updatedMembership.username,
          courseId: updatedMembership.course_id,
          role: updatedMembership.role,
          previousRole,
        },
      } satisfies ManageRoleResponse),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Manage roles error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to update role: " + errorMessage,
      } satisfies ManageRoleResponse),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  } finally {
    if (db) {
      try {
        await db.client.end();
      } catch (closeError) {
        console.error("Error closing database connection:", closeError);
      }
    }
  }
}
