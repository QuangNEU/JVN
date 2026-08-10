import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_KEYS } from "@/constants/auth";



export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const cookiesStore = await cookies()
    const accessToken = cookiesStore.get(AUTH_KEYS.ACCESS_TOKEN)?.value
    const { id } = await params

    try {
        const djangoRes = await axios.get(`${process.env.API_URL}/jobs/jobposts/${id}/`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        })
        return NextResponse.json(djangoRes.data)
    } catch (err: any) {
        return NextResponse.json(
            { error: err.response?.data?.error || 'Failed to get job post detail' },
            { status: err.response?.status || 500 }
        )
    }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const cookiesStore = await cookies()
    const accessToken = cookiesStore.get('accessToken')?.value
    const body = await request.json()
    const { id } = await params
    if (!accessToken) {
        return NextResponse.json(
            { error: 'access Token not found' },
            { status: 401 }
        )
    }
    try {
        const djangoRes = await axios.patch(`${process.env.API_URL}/jobs/jobposts/${id}/`, body, {
            headers: { Authorization: `Bearer ${accessToken}` }
        })
        return NextResponse.json(djangoRes.data)
    } catch (err: any) {
        return NextResponse.json(
            { error: err.response?.data?.error || 'Failed to update job post detail' },
            { status: err.response?.status || 500 }
        )
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const cookiesStore = await cookies()
    const accessToken = cookiesStore.get(AUTH_KEYS.ACCESS_TOKEN)?.value
    const { id } = await params
    if (!accessToken) {
        return NextResponse.json(
            { error: 'access Token not found' },
            { status: 401 }
        )
    }
    try {
        const djangoRes = await axios.delete(`${process.env.API_URL}/jobs/jobposts/${id}/`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        })
        return NextResponse.json(djangoRes.data)
    } catch (err: any) {
        return NextResponse.json(
            { error: err.response?.data?.error || 'Failed to delete job post detail' },
            { status: err.response?.status || 500 }
        )
    }
}