import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
    const body = await req.json()

    try {
        const danjgoRes = await axios.post(
            `${process.env.API_URL}/accounts/password/forgot/`,
            body
        )
    } catch (err: any) {
        const status = err.response?.status || 500
        const error = err.response?.data?.error || 'Request fail'
        return NextResponse.json({ error: error }, { status })
    }
    const response = NextResponse.json('Resques sent check your mail')
    return response
}