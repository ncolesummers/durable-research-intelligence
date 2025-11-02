import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { ERRORS } from "@/lib/api/errors";
import { getAuthenticatedUserId } from "@/lib/auth/middleware";
import { db, researchSessions } from "@/lib/db";

/**
 * Handle GET requests that fetch the latest status for a research session.
 *
 * @param request - Incoming Next.js request.
 * @param params - Route parameters containing the session id.
 * @returns A JSON payload describing the current session state.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Authenticate user
    const userId = await getAuthenticatedUserId();
    const { id: sessionId } = await params;

    // Fetch session from database
    const [session] = await db
      .select()
      .from(researchSessions)
      .where(
        and(
          eq(researchSessions.id, sessionId),
          eq(researchSessions.userId, userId),
        ),
      );

    if (!session) {
      return ERRORS.NOT_FOUND("Research session not found");
    }

    // Calculate progress based on status
    const progressMap: Record<string, number> = {
      pending: 0,
      decomposing: 20,
      searching: 50,
      steering_wait: 60,
      synthesizing: 80,
      completed: 100,
      failed: 0,
    };

    const progress = progressMap[session.status] ?? 0;

    // Calculate elapsed time
    const startedAt = session.startedAt
      ? new Date(session.startedAt)
      : new Date();
    const now = new Date();
    const elapsedSeconds = Math.floor(
      (now.getTime() - startedAt.getTime()) / 1000,
    );

    // Estimate remaining time (rough estimate)
    const estimatedRemainingSeconds =
      session.status === "completed" || session.status === "failed"
        ? undefined
        : Math.max(0, 90 - elapsedSeconds); // Assuming 90s total workflow time

    // Build response
    const response: {
      sessionId: string;
      status: string;
      progress: number;
      currentStep: string;
      sourcesFound: number;
      elapsedSeconds: number;
      estimatedRemainingSeconds?: number;
      steeringPrompt?: { message: string; suggestedCommands: string[] };
      finalReport?: string;
      tokensUsed?: number;
      costUSD?: string;
      error?: { message: string; failedStep: string; retryable: boolean };
    } = {
      sessionId: session.id,
      status: session.status,
      progress,
      currentStep: getCurrentStepMessage(session.status),
      sourcesFound: session.sourcesFound ?? 0,
      elapsedSeconds,
      ...(estimatedRemainingSeconds !== undefined && {
        estimatedRemainingSeconds,
      }),
    };

    // Add status-specific fields
    if (session.status === "steering_wait") {
      response.steeringPrompt = {
        message: "Query decomposed. You can now steer the research direction.",
        suggestedCommands: [
          "continue",
          "add_source",
          "exclude_topic",
          "change_direction",
        ],
      };
    }

    if (session.status === "completed") {
      response.finalReport = session.finalReport ?? undefined;
      response.tokensUsed = session.tokensUsed ?? undefined;
      response.costUSD = session.costUSD ?? undefined;
    }

    if (session.status === "failed") {
      const metadata = session.metadata as {
        error?: { message: string; step: string };
      } | null;
      response.error = {
        message: metadata?.error?.message ?? "Unknown error occurred",
        failedStep: metadata?.error?.step ?? "unknown",
        retryable: true,
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof Error && error.message === "Unauthorized") {
      return ERRORS.UNAUTHORIZED();
    }

    console.error("Error fetching session status:", error);
    return ERRORS.INTERNAL_SERVER_ERROR("Failed to fetch session status");
  }
}

/**
 * Get human-readable current step message
 */
function getCurrentStepMessage(status: string): string {
  const messages: Record<string, string> = {
    pending: "Initializing...",
    decomposing: "Decomposing query into sub-queries...",
    searching: "Searching for sources...",
    steering_wait: "Waiting for steering input...",
    synthesizing: "Synthesizing research report...",
    completed: "Research completed",
    failed: "Research failed",
  };

  return messages[status] ?? "Processing...";
}
