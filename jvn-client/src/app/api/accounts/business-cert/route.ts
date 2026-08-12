import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import { AUTH_KEYS } from "@/constants/auth";

export async function GET(request: NextRequest) {
    const cookiesStore = await cookies();
    const accessToken = cookiesStore.get(AUTH_KEYS.ACCESS_TOKEN)?.value;

    if (!accessToken) {
        return NextResponse.json({ error: "access Token not found" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams.toString();

    try {
        const djangoRes = await axios.get(
            `${process.env.API_URL}/accounts/business-cert/${searchParams ? '?' + searchParams : ''}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        return NextResponse.json(djangoRes.data);
    } catch (err: any) {
        return NextResponse.json(
            err.response?.data || { error: "Failed to fetch business cert list" },
            { status: err.response?.status || 500 }
        );
    }
}