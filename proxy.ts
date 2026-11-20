import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('admin_access_token')?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = ['/login', '/register', '/forgot-password'].some((p) =>
    pathname.startsWith(p)
  );
  const isProtected = pathname.startsWith('/dashboard');

  // If user is on auth page and has token, redirect to dashboard
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Allow protected routes to pass through - let auth context handle verification
  // This ensures tokens can be restored from localStorage on refresh
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register', '/forgot-password'],
};


