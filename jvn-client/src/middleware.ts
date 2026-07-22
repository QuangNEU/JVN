// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/cvs', '/company'];   // route cần đăng nhập
const companyOnlyRoutes = ['/company'];           // route chỉ Company vào được

export function middleware(request: NextRequest) {
    const accessToken = request.cookies.get('accessToken')?.value;
    const { pathname } = request.nextUrl;

    const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

    if (isProtected && !accessToken) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/cvs/:path*', '/company/:path*'],
};