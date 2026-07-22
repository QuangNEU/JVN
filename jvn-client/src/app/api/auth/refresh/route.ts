import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";

export async function POST() {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get("refreshToken")?.value;

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
        return response;
    }
    catch {
        const response = NextResponse.json(
            { error: "Invalid refresh token" },
            { status: 401 }
        )
        response.cookies.delete("refreshToken");
        response.cookies.delete("accessToken")
        return response;
    }
}