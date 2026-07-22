import { NextRequest, NextResponse } from "next/server";
import axios from "axios";


export async function GET(request: NextRequest) {
    const accessToken = request.cookies.get('accessToken')?.value;

    if (!accessToken) {
        return NextResponse.json({ error: 'Havent login yet' }, { status: 401 })
    }

    try {
        const djangoRes = await axios.get(`${process.env.API_URL}/accounts/profile/`, {
            headers: { Authorization: `Bearer ${accessToken}` }
        })
        return NextResponse.json(djangoRes.data)
    } catch (err: any) {
        return NextResponse.json(
            { error: err.response?.data },
            { status: err.response?.status || 500 }
        )
    }

}