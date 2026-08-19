import { AUTH_KEYS } from "@/constants/auth";
import axios from "axios";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
    const cookiesStore = await cookies();
    const accessToken = cookiesStore.get(AUTH_KEYS.ACCESS_TOKEN)?.value;

    if (!accessToken) {
        return NextResponse.json({ error: 'access Token not found' }, { status: 401 });
    }

    try {
        const djangoRes = await axios.get(`${process.env.API_URL}/companies/system-overview/`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return NextResponse.json(djangoRes.data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.response?.data?.error || 'Failed to fetch system overview' },
            { status: error.response?.status || 500 }
        );
    }
}