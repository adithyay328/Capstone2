import { NextResponse } from "next/server";
import { CreateUserRequestSchema, CreateUserResponseSchema } from "./types";

import { DBConnection } from "@/app/sql/sql";


import * as crypto from "crypto";

export async function POST(req: Request) {
  let db: DBConnection | null = null;
  
  try {
    // Parse and validate request body
    const body = await req.json();
    const validatedBody = CreateUserRequestSchema.parse(body);

    const { username, password, instructor } = validatedBody;

    // Get database connection
    db = new DBConnection();
    const client = db.client;

    // Get HMAC secret from database
    const secretResult = await client.query(
      "SELECT value FROM secrets WHERE name = 'hmac'"
    );
    
    if (secretResult.rows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "HMAC secret not found in database",
        },
        { status: 500 }
      );
    }

    const hmacSecret = secretResult.rows[0].value;

    // Generate 2000-character random salt
    const salt = crypto.randomBytes(1000).toString('hex').substring(0, 2000);

    // Create HMAC hash of password + salt
    const hmac = crypto.createHmac('sha256', hmacSecret);
    hmac.update(password + salt);
    const passwordHash = hmac.digest('hex');

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
