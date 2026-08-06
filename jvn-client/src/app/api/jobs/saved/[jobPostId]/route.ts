import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import { AUTH_KEYS } from "@/constants/auth";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ jobPostId: string }> }
) {
    const { jobPostId } = await params;
    const cookiesStore = await cookies();
    const accessToken = cookiesStore.get(AUTH_KEYS.ACCESS_TOKEN)?.value;

    if (!accessToken) {
        return NextResponse.json({ error: "access Token not found" }, { status: 401 });
    }

    try {
        const djangoRes = await axios.post(
            `${process.env.API_URL}/jobs/saved/${jobPostId}/`,
            {},
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        return NextResponse.json(djangoRes.data);
    } catch (err: any) {
        return NextResponse.json(
            err.response?.data || { error: "Save failed" },
            { status: err.response?.status || 500 }
        );
    }
}