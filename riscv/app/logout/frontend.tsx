'use client';

export async function logout(): Promise<boolean> {
  try {
    const response = await fetch('/logout/api', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
}
