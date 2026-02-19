import { NextResponse } from "next/server";
import { CreateUserRequestSchema, CreateUserResponseSchema } from "./types";

import { DBConnection } from "@/app/sql/sql";
import { hashPassword, generateSalt } from "@/app/passwords";
import { verifyCookieInternal } from "@/app/verify/internal";
import { modifyCookieData } from "@/app/verify/modify";

export async function POST(req: Request) {
  let db: DBConnection | null = null;
  
  try {
    // Verify the cookie to ensure user is authenticated
    const cookieHeader = req.headers.get('cookie') || '';
    const verifyResponse = await verifyCookieInternal(cookieHeader);

    // Check that username is set and student boolean exists
    if (!verifyResponse.data || 
        !verifyResponse.data.username || 
        typeof verifyResponse.data.student === 'undefined') {
      const modifiedCookie = await modifyCookieData({});

      return NextResponse.json(
        {
          success: false,
          message: "Invalid or missing authentication",
        },
        { status: 401, headers: { 'Set-Cookie': modifiedCookie } }
      );
    }

    // Check that user is an instructor (student must be false)
    if (verifyResponse.data.student !== false) {
      return NextResponse.json(
        {
          success: false,
          message: "Only instructors can create users",
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedBody = CreateUserRequestSchema.parse(body);

    const { username, password, instructor } = validatedBody;

    // Get database connection
    db = new DBConnection();
    const client = db.client;

    // Generate 2000-character random salt (for database compatibility)
    const salt = generateSalt();

    // Hash password using Argon2id
    const passwordHash = await hashPassword(password);

    // Insert user into database
    await client.query(
      "INSERT INTO users (username, salt, password_hash, instructor) VALUES ($1, $2, $3, $4)",
      [username, salt, passwordHash, instructor]
    );

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "User created successfully",
      },
      { status: 201 }
    );

  } catch (error: any) {
    // Handle Zod validation errors
    if (error.name === "ZodError") {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid request format: " + error.errors.map((e: any) => e.message).join(", "),
        },
        { status: 400 }
      );
    }

    // Handle database errors
    if (error.code === '23505') { // Unique violation
      return NextResponse.json(
        {
          success: false,
          message: "Username already exists",
        },
        { status: 409 }
      );
    }

    // Handle other errors
    console.error("Error creating user:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to create user: " + (error.message || "Unknown error"),
      },
      { status: 500 }
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
