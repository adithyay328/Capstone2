'use client';

import { GradeStatusResponse } from './types';

/**
 * Frontend function to get remaining grade attempts for a lab.
 *
 * @param lab_uid - The UID of the lab
 * @returns GradeStatusResponse with attempts info
 */
export async function getGradeStatus(lab_uid: string): Promise<GradeStatusResponse> {
  try {
    const response = await fetch('/api/grade_status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ lab_uid }),
    });

    const data: GradeStatusResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Grade status frontend error:', error);
    return {
      error: 'Failed to connect to the server',
    };
  }
}
