/**
 * Browser-side Supabase helper used by client components.
 */

import { createBrowserClient } from "@supabase/ssr";

/**
 * Create a Supabase client that stores auth state in the browser.
 *
 * @returns A Supabase client ready for client component usage.
 */
export function createClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
        throw new Error("Supabase client environment variables are missing");
    }

    return createBrowserClient(url, anonKey);
}
