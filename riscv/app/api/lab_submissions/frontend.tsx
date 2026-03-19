'use client';

import type {
  LabSubmissionsResponse,
  SaveLabSubmissionRequest,
} from './types';

export async function getLabSubmissions(
  course_id: string,
  lab_uid: string
): Promise<LabSubmissionsResponse> {
  try {
    const response = await fetch(
      `/api/lab_submissions?course_id=${encodeURIComponent(course_id)}&lab_uid=${encodeURIComponent(lab_uid)}`
    );
    const data: LabSubmissionsResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Get lab submissions frontend error:', error);
    return {
      success: false,
      submissions: [],
      message: 'Failed to connect to the server',
    };
  }
}

export async function saveLabSubmission(
  submission: SaveLabSubmissionRequest
): Promise<LabSubmissionsResponse> {
  try {
    const response = await fetch('/api/lab_submissions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(submission),
    });

    const data: LabSubmissionsResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Save lab submission frontend error:', error);
    return {
      success: false,
      message: 'Failed to connect to the server',
    };
  }
}
