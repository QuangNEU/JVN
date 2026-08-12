import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import { AUTH_KEYS } from "@/constants/auth";

export async function POST(request: NextRequest) {
    const cookiesStore = await cookies();
    const accessToken = cookiesStore.get(AUTH_KEYS.ACCESS_TOKEN)?.value;

    if (!accessToken) {
        return NextResponse.json({ error: "access Token not found" }, { status: 401 });
    }

    const formData = await request.formData();

    try {
        const djangoRes = await axios.post(
            `${process.env.API_URL}/accounts/business-cert/submit/`,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    // KHÔNG tự set 'Content-Type': 'multipart/form-data' ở đây
                },
            }
        );
        return NextResponse.json(djangoRes.data);
    } catch (err: any) {
        return NextResponse.json(
            err.response?.data || { error: "Submit failed" },
            { status: err.response?.status || 500 }
        );
    }
}