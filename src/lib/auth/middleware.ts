/**
 * Supabase authentication utilities tailored for API Route handlers.
 */

import type { User } from "@supabase/supabase-js";
import { createClient } from "./client";

/**
 * Ensure the current request is authenticated and return the Supabase user.
 *
 * @throws Error when the request is not authenticated.
 * @returns The authenticated Supabase user record.
 */
export async function getAuthenticatedUser(): Promise<User> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized");
  }

  return user;
}

/**
 * Retrieve the authenticated Supabase user id for API routes.
 *
 * @throws Error when the request is not authenticated.
 * @returns The user id belonging to the authenticated request.
 */
export async function getAuthenticatedUserId(): Promise<string> {
  const user = await getAuthenticatedUser();
  return user.id;
}
