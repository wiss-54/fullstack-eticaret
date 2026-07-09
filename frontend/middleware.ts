import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ADMIN_HOST = 'admintest.hatiraniyarat.com';
const PUBLIC_HOST = 'test.hatiraniyarat.com';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.split(':')[0] ?? '';
  const { pathname } = request.nextUrl;

  if (host === ADMIN_HOST) {
    if (pathname === '/login') {
      return NextResponse.rewrite(new URL('/admin/login', request.url));
    }

    if (pathname === '/') {
      return NextResponse.rewrite(new URL('/admin', request.url));
    }

    if (pathname.startsWith('/admin')) {
      const cleanPath = pathname.replace(/^\/admin/, '') || '/';
      return NextResponse.redirect(new URL(cleanPath, request.url));
    }

    return NextResponse.next();
  }

  if (host === PUBLIC_HOST && pathname.startsWith('/admin')) {
    const adminPath = pathname.replace(/^\/admin/, '') || '/';
    return NextResponse.redirect(new URL(adminPath, `https://${ADMIN_HOST}`));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
