'use client';

import { VerifyRequest, VerifyResponse } from './types';

/**
 * Verifies a cookie with sens data
 * @param cookie - The full cookie string containing sens data
 * @returns Promise with verification result
 */
export async function verifyCookie(cookie: string): Promise<VerifyResponse> {
  try {
    const response = await fetch('/app/verify/api', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ cookie } satisfies VerifyRequest),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Verification failed:', error);
    throw error;
  }
}
