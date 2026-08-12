import { NextRequest, NextResponse } from 'next/server';
import { AUTH_KEYS } from '@/constants/auth';

const protectedRoutes = ['/cvs', '/profile', '/application'];
const employerProtectedRoutes = ['/jobs', '/applicants', '/dashboard'];
const ADMIN_PUBLIC_ROUTES = ['/login'];
const SHARED_ROUTES = ['/forgot-password', '/reset-password'];

export function proxy(request: NextRequest) {
    const hostname = request.headers.get('host') || '';
    const { pathname } = request.nextUrl;
    const url = request.nextUrl.clone();

    const accessToken = request.cookies.get(AUTH_KEYS.ACCESS_TOKEN)?.value;
    const userRole = request.cookies.get(AUTH_KEYS.USER_ROLE)?.value;

    const isEmployerDomain = hostname.startsWith('tuyendung.');
    const isAdminDomain = hostname.startsWith('admin.');

    if (SHARED_ROUTES.some((r) => pathname.startsWith(r))) {
        url.pathname = `/seeker-app${pathname}`;
        return NextResponse.rewrite(url);
    }

    if (isAdminDomain) {
        url.pathname = `/admin-app${pathname}`;
    } else if (isEmployerDomain) {
        url.pathname = `/employer-app${pathname}`;
    } else {
        url.pathname = `/seeker-app${pathname}`;
    }

    if (isAdminDomain) {
        const isPublicAdminRoute = ADMIN_PUBLIC_ROUTES.some((r) => pathname.startsWith(r));
        if (!isPublicAdminRoute && !accessToken) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        if (!isPublicAdminRoute && userRole !== 'ADMIN') {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    } else if (isEmployerDomain) {
        const needsAuth = employerProtectedRoutes.some((r) => pathname.startsWith(r));
        if (needsAuth && !accessToken) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
        if (needsAuth && userRole !== 'COMPANY') {
            return NextResponse.redirect(new URL('/', request.url));
        }
    } else {
        const needsAuth = protectedRoutes.some((r) => pathname.startsWith(r));
        if (needsAuth && !accessToken) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.rewrite(url);
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$|.*\\.jpg$|.*\\.svg$|favicon.ico).*)',],
};