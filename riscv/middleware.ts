import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyCookieInternal } from '@/app/verify/internal';
import type { VerifyResponse } from '@/app/verify/types';
import { modifyCookieData } from './app/verify/modify';

// Define which routes should be protected by middleware
export const config = {
  runtime: 'nodejs', // Specify the Node.js runtime
  matcher: [
    '/student/:path*',
    '/instructor/:path*'
  ],
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Run verification for all routes, figure out
  // if the user is actually verified
  // or not.

  const verifyResponse: VerifyResponse = await verifyCookieInternal(String(request.cookies));

  // If the JSON returned is null, the user is not logged in,
  // send them to the login page.
  if (verifyResponse.data === null) {
    // First off, clear their cookies
    const modifiedCookie = await modifyCookieData({});

    const response = NextResponse.redirect(new URL('/login', request.url));
    response.headers.set('Set-Cookie', modifiedCookie);
    return response;
  }

  // The only other violation is if
  // the user is a student, and accessing a non
  // /student route
  const isStudentRoute = pathname.indexOf('student') !== -1;
  const isUserStudent = verifyResponse.data.student;
  if ( isUserStudent && !isStudentRoute ) {
    const studentUrl = new URL('/student', request.url);
    return NextResponse.redirect(studentUrl);
  } else if ( !isUserStudent && isStudentRoute ) {
    const homeUrl = new URL('/instructor', request.url);
    return NextResponse.redirect(homeUrl);
  }
}