/**
 * Server-side helpers for reading Supabase sessions and user data.
 */

import type { User } from "@supabase/supabase-js";
import { createClient } from "./client";

/**
 * Retrieve the current Supabase session while running on the server.
 *
 * @returns The active session or null when the request is unauthenticated.
 */
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    return null;
  }

  return session;
}

/**
 * Retrieve the authenticated Supabase user for the request.
 *
 * @returns The user record or null when unauthenticated.
 */
export async function getUser(): Promise<User | null> {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Convenience helper that returns just the user id for the current session.
 *
 * @returns The user id string or null when unauthenticated.
 */
export async function getUserId(): Promise<string | null> {
  const user = await getUser();
  return user?.id ?? null;
}
