import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import { AUTH_KEYS } from "@/constants/auth";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ companyId: string }> }
) {
    const { companyId } = await params;
    const cookiesStore = await cookies();
    const accessToken = cookiesStore.get(AUTH_KEYS.ACCESS_TOKEN)?.value;

    if (!accessToken) {
        return NextResponse.json({ error: "access Token not found" }, { status: 401 });
    }

    const body = await request.json();

    try {
        const djangoRes = await axios.post(
            `${process.env.API_URL}/accounts/business-cert/${companyId}/reject/`,
            body,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        return NextResponse.json(djangoRes.data);
    } catch (err: any) {
        return NextResponse.json(
            err.response?.data || { error: "Reject failed" },
            { status: err.response?.status || 500 }
        );
    }
}