import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { ERRORS } from "@/lib/api/errors";
import { startResearchSchema } from "@/lib/api/schemas";
import { getAuthenticatedUserId } from "@/lib/auth/middleware";
import { db, researchSessions } from "@/lib/db";

/**
 * Handle POST requests to create a new research session.
 *
 * @param request - Incoming Next.js request.
 * @returns The created session metadata or an error response.
 */
export async function POST(request: NextRequest) {
    try {
        // Authenticate user
        const userId = await getAuthenticatedUserId();

        // Parse and validate request body
        const body = await request.json();
        const validationResult = startResearchSchema.safeParse(body);

        if (!validationResult.success) {
            return ERRORS.BAD_REQUEST(
                "Invalid request",
                validationResult.error.issues,
            );
        }

        const { query, options } = validationResult.data;

        // Generate session ID and workflow ID (placeholder for now)
        const sessionId = randomUUID();
        const workflowId = `workflow-${sessionId}`; // Placeholder until Week 2

        // Create research session in database
        const [session] = await db
            .insert(researchSessions)
            .values({
                id: sessionId,
                userId,
                query,
                workflowId,
                status: "pending",
                startedAt: new Date(),
                metadata: {
                    options: {
                        enableSteering: options?.enableSteering ?? true,
                        maxSources: options?.maxSources ?? 30,
                        searchAgents: options?.searchAgents ?? [
                            "web",
                            "academic",
                            "github",
                        ],
                    },
                },
            })
            .returning();

        // TODO: Trigger Vercel Workflow in Week 2
        // For now, just return the session

        return NextResponse.json(
            {
                sessionId: session.id,
                workflowId: session.workflowId,
                status: session.status,
                createdAt: session.startedAt?.toISOString() ?? new Date().toISOString(),
            },
            { status: 201 },
        );
    } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
            return ERRORS.UNAUTHORIZED();
        }

        console.error("Error creating research session:", error);
        return ERRORS.INTERNAL_SERVER_ERROR("Failed to create research session");
    }
}
