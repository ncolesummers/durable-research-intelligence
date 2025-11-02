/**
 * Server-side Supabase client utilities used by API routes and proxies.
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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
 * Build a Supabase client that persists auth cookies on the server.
 *
 * @returns A Supabase client scoped to the current request cookies.
 */
export async function createClient() {
    const cookieStore = await cookies();
    type CookiePayload = {
        name: string;
        value: string;
        options?: Parameters<typeof cookieStore.set>[2];
    };

    return createServerClient(supabaseUrl, supabaseAnonKey, {
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
                    // The `setAll` method was called from a Server Component.
                    // This can be ignored if you have proxy refreshing
                    // user sessions.
                }
            },
        },
    });
}

/**
 * Build a Supabase client using the service role key for privileged operations.
 *
 * @throws Error when the service role key environment variable is missing.
 * @returns A Supabase client with service-level permissions.
 */
export function createServiceClient() {
    const serviceRoleKey = getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY");

    return createServerClient(supabaseUrl, serviceRoleKey, {
        cookies: {
            getAll() {
                return [];
            },
            setAll() {
                // No-op for service role client
            },
        },
    });
}
