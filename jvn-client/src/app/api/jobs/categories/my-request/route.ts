import { AUTH_KEYS } from "@/constants/auth";
import axios from "axios";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const cookiesStore = await cookies();
    const accessToken = cookiesStore.get(AUTH_KEYS.ACCESS_TOKEN)?.value;

    if (!accessToken) {
        return NextResponse.json({ error: 'access Token not found' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams.toString();

    try {
        const djangoRes = await axios.get(
            `${process.env.API_URL}/jobs/category/my-requests/${searchParams ? '?' + searchParams : ''}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        return NextResponse.json(djangoRes.data);
    } catch (error: any) {
        return NextResponse.json(
            { error: error.response?.data?.error || 'Failed to fetch my category requests' },
            { status: error.response?.status || 500 }
        );
    }
}