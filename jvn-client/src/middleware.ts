// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/cvs', '/company'];   // route cần đăng nhập
const companyOnlyRoutes = ['/company'];           // route chỉ Company vào được

export function middleware(request: NextRequest) {
    const accessToken = request.cookies.get('accessToken')?.value;
    const userRole = request.cookies.get('role')?.value;
    const { pathname } = request.nextUrl;

    const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

    const isCompanyOnly = companyOnlyRoutes.some((route) => pathname.startsWith(route));

    if (isProtected && !accessToken) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (isCompanyOnly && userRole !== 'company') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/cvs/:path*', '/company/:path*'],
};