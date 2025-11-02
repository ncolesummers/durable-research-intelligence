import { and, count, desc, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ERRORS } from "@/lib/api/errors";
import { historyQuerySchema } from "@/lib/api/schemas";
import type { ResearchHistoryResponse } from "@/lib/api/types";
import { getAuthenticatedUserId } from "@/lib/auth/middleware";
import { db, researchSessions } from "@/lib/db";

/**
 * Handle GET requests that list a user's research session history.
 *
 * @param request - Incoming Next.js request with optional pagination params.
 * @returns A paginated list of sessions or an error response.
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const userId = await getAuthenticatedUserId();

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = {
      limit: searchParams.get("limit"),
      offset: searchParams.get("offset"),
      status: searchParams.get("status"),
    };

    const validationResult = historyQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return ERRORS.BAD_REQUEST(
        "Invalid query parameters",
        validationResult.error.issues,
      );
    }

    const { limit, offset, status } = validationResult.data;

    // Build query
    const conditions = [eq(researchSessions.userId, userId)];

    if (status !== "all") {
      conditions.push(eq(researchSessions.status, status));
    }

    // Fetch sessions with pagination
    const sessions = await db
      .select({
        id: researchSessions.id,
        query: researchSessions.query,
        status: researchSessions.status,
        sourcesFound: researchSessions.sourcesFound,
        startedAt: researchSessions.startedAt,
        completedAt: researchSessions.completedAt,
        costUSD: researchSessions.costUSD,
      })
      .from(researchSessions)
      .where(and(...conditions))
      .orderBy(desc(researchSessions.startedAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(researchSessions)
      .where(and(...conditions));

    const total = totalResult?.count ?? 0;
    const hasMore = offset + sessions.length < total;

    const response: ResearchHistoryResponse = {
      sessions: sessions.map((session) => ({
        id: session.id,
        query: session.query,
        status: session.status ?? "pending",
        sourcesFound: session.sourcesFound ?? 0,
        startedAt: session.startedAt?.toISOString() ?? new Date().toISOString(),
        completedAt: session.completedAt?.toISOString(),
        costUSD: session.costUSD ?? undefined,
      })),
      total,
      hasMore,
    };

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return ERRORS.UNAUTHORIZED();
    }

    console.error("Error fetching research history:", error);
    return ERRORS.INTERNAL_SERVER_ERROR("Failed to fetch research history");
  }
}
