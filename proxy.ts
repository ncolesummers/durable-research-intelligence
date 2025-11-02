/**
 * Next.js proxy file used to enforce authentication for protected routes.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function getRequiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} is not set`);
    }
    return value;
}

const supabaseUrl = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const supabaseAnonKey = getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

/**
 * Guard protected pages and API routes by validating Supabase auth state.
 *
 * @param request - Incoming request intercepted by the Next.js proxy.
 * @returns A redirect response for unauthenticated access or `NextResponse.next()`.
 */
export async function proxy(request: NextRequest) {
    // Create Supabase client in proxy context
    const cookieStore = await cookies();
    type CookiePayload = {
        name: string;
        value: string;
        options?: Parameters<typeof cookieStore.set>[2];
    };

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet: ReadonlyArray<CookiePayload>) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                } catch {
                    // Ignore if called from proxy
                }
            },
        },
    });

    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { pathname } = request.nextUrl;

    // Allow public access to auth pages
    if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
        // If user is already logged in, redirect to dashboard
        if (user) {
            return NextResponse.redirect(new URL("/dashboard", request.url));
        }
        return NextResponse.next();
    }

    // Protect dashboard and API routes
    if (
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/api/research")
    ) {
        if (!user) {
            const loginUrl = new URL("/login", request.url);
            loginUrl.searchParams.set("redirect", pathname);
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

/**
 * Configure which routes the proxy should run on.
 */
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
