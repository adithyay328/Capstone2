'use client';

import { LoginRequest, LoginResponse } from './types';

/**
 * Attempts to log in a user
 * @param username - The username
 * @param password - The password
 * @returns Promise with login result
 */
export async function login(username: string, password: string): Promise<LoginResponse> {
  try {
    const response = await fetch('/login/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password } satisfies LoginRequest),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Login failed:', error);
    return {
      success: false,
      username: ''
    };
  }
}
