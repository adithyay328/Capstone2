import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyCookie } from '@/app/verify/frontend';
import type { VerifyResponse } from '@/app/verify/types';

// Define which routes should be protected by middleware
export const config = {
  matcher: [
    '/:path*', // Protect all routes
  ],
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Allow access to login page and other public routes
  const publicRoutes = ['/login'];
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Get the cookie from the request
  const cookie = request.headers.get('cookie') || '';
  
  // If no cookie exists, redirect to login
  if (!cookie) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    // Call the existing verification frontend helper
    const result: VerifyResponse = await verifyCookie(cookie);

    // ALWAYS update the cookie with the returned cookie from verification
    const response = NextResponse.next();
    response.headers.set('Set-Cookie', result.cookie);

    // Check if verification was successful (data is not null)
    if (!result.data) {
      // Verification failed, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Extract user data from verified cookie
    const { username, student } = result.data as { username: string; student: boolean };

    // If no username, redirect to login
    if (!username) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Handle routing based on user role
    if (student) {
      // Student: redirect to /student if not accessing student routes
      if (!pathname.startsWith('/student')) {
        const redirectResponse = NextResponse.redirect(new URL('/student', request.url));
        redirectResponse.headers.set('Set-Cookie', result.cookie);
        return redirectResponse;
      }
      // Allow access to student routes
      return response;
    } else {
      // Instructor: redirect to /instructor if not accessing instructor routes
      if (!pathname.startsWith('/instructor')) {
        const redirectResponse = NextResponse.redirect(new URL('/instructor', request.url));
        redirectResponse.headers.set('Set-Cookie', result.cookie);
        return redirectResponse;
      }
      // Allow access to instructor routes
      return response;
    }

  } catch (error) {
    console.error('Middleware verification error:', error);
    // On any error, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
