import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import { AUTH_KEYS } from "@/constants/auth";

export async function GET() {
    const cookiesStore = await cookies();
    const accessToken = cookiesStore.get(AUTH_KEYS.ACCESS_TOKEN)?.value;

    if (!accessToken) {
        return NextResponse.json({ error: "access Token not found" }, { status: 401 });
    }

    try {
        const djangoRes = await axios.get(`${process.env.API_URL}/resumes/cv/`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return NextResponse.json(djangoRes.data);
    } catch (err: any) {
        return NextResponse.json(
            err.response?.data || { error: "Fetch failed" },
            { status: err.response?.status || 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    const cookiesStore = await cookies();
    const accessToken = cookiesStore.get(AUTH_KEYS.ACCESS_TOKEN)?.value;

    if (!accessToken) {
        return NextResponse.json({ error: "access Token not found" }, { status: 401 });
    }

    try {
        const formData = await request.formData();


        const response = await fetch(`${process.env.API_URL}/resumes/cv/`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
            body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
            return NextResponse.json(data, { status: response.status });
        }

        return NextResponse.json(data, { status: 201 });
    } catch (err: any) {
        return NextResponse.json(
            { error: err.message || "Created failed" },
            { status: 500 }
        );
    }
}