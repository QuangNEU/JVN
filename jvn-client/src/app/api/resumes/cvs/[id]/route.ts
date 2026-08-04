import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import axios from "axios";
import { AUTH_KEYS } from "@/constants/auth";

interface Params {
    params: { id: string };
}

export async function GET(_request: NextRequest, { params }: Params) {
    const cookiesStore = await cookies();
    const accessToken = cookiesStore.get(AUTH_KEYS.ACCESS_TOKEN)?.value;

    if (!accessToken) {
        return NextResponse.json({ error: "access Token not found" }, { status: 401 });
    }

    try {
        const djangoRes = await axios.get(`${process.env.API_URL}/resumes/cv/${params.id}/`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return NextResponse.json(djangoRes.data);
    } catch (err: any) {
        return NextResponse.json(
            { error: err.response?.data?.error || "Fetch failed" },
            { status: err.response?.status || 500 }
        );
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const cookiesStore = await cookies();
    const accessToken = cookiesStore.get(AUTH_KEYS.ACCESS_TOKEN)?.value;
    const { id } = await params;

    if (!accessToken) {
        return NextResponse.json({ error: "access Token not found" }, { status: 401 });
    }

    const formData = await request.formData();

    try {
        const djangoRes = await axios.patch(`${process.env.API_URL}/resumes/cv/${id}/`, formData, {
            headers: { Authorization: `Bearer ${accessToken}` },
            adapter: "fetch",
        });
        return NextResponse.json(djangoRes.data);
    } catch (err: any) {
        return NextResponse.json(
            { error: err.response?.data?.error || "Update failed" },
            { status: err.response?.status || 500 }
        );
    }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const cookiesStore = await cookies();
    const accessToken = cookiesStore.get(AUTH_KEYS.ACCESS_TOKEN)?.value;
    const { id } = await params;

    if (!accessToken) {
        return NextResponse.json({ error: "access Token not found" }, { status: 401 });
    }

    try {
        await axios.delete(`${process.env.API_URL}/resumes/cv/${id}/`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        return new NextResponse(null, { status: 204 });
    } catch (err: any) {
        return NextResponse.json(
            { error: err.response?.data?.error || "Delete failed" },
            { status: err.response?.status || 500 }
        );
    }
}