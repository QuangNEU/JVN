import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_KEYS } from "@/constants/auth";
import axios from "axios";

export async function POST() {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get("refreshToken")?.value;
    const currentRole = cookieStore.get(AUTH_KEYS.USER_ROLE)?.value

    if (!refreshToken) {
        return NextResponse.json({ error: 'No refresh token' }, { status: 401 })
    }
    try {
        const djangoRes = await axios.post(
            `${process.env.API_URL}/accounts/login/refresh/`,
            { refresh: refreshToken }
        )

        const response = NextResponse.json({ success: true });
        response.cookies.set("accessToken", djangoRes.data.access, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 15,
        });

        if (currentRole) {
            response.cookies.set(AUTH_KEYS.USER_ROLE, currentRole, {
                httpOnly: false,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 7,
            })
        }

        if (djangoRes.data.refresh) {
            response.cookies.set(AUTH_KEYS.REFRESH_TOKEN, djangoRes.data.refresh, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/',
                maxAge: 60 * 60 * 24 * 7,
            });
        }
        return response;
    }
    catch {
        const response = NextResponse.json(
            { error: "Invalid refresh token" },
            { status: 401 }
        )
        response.cookies.delete("refreshToken");
        response.cookies.delete("accessToken");
        response.cookies.delete(AUTH_KEYS.USER_ROLE);
        return response;
    }
}