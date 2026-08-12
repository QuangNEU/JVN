import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(request: NextRequest) {
    const body = await request.json();

    try {
        const djangoRes = await axios.post(
            `${process.env.API_URL}/accounts/email/confirm/`,
            body
        );
        return NextResponse.json(djangoRes.data);
    } catch (err: any) {
        return NextResponse.json(
            err.response?.data || { error: "Confirm failed" },
            { status: err.response?.status || 500 }
        );
    }
}