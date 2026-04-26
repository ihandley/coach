import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, isAuthenticated } from "./app/auth";

export function proxy(request: NextRequest) {
    const isAuthed = isAuthenticated(
        request.cookies.get(AUTH_COOKIE_NAME)?.value,
    );

    if (isAuthed) {
        return NextResponse.next();
    }

    const res = NextResponse.next();

    res.cookies.set(AUTH_COOKIE_NAME, "1", {
        httpOnly: true,
        path: "/",
    });

    return res;
}

export const config = {
    matcher: ["/((?!_next|favicon.ico).*)"],
};
