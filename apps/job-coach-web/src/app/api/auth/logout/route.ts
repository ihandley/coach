import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME } from "../../../auth";

export async function POST() {
    const res = NextResponse.json({ ok: true });

    res.cookies.set(AUTH_COOKIE_NAME, "", {
        httpOnly: true,
        path: "/",
        expires: new Date(0),
    });

    return res;
}
