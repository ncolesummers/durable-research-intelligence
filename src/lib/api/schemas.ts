import { z } from "zod";
import type { StartResearchRequest } from "./types";

/**
 * Validation schemas that enforce the REST API contracts implemented by the route handlers.
 */

/**
 * Validate payloads sent to the `/api/research/start` endpoint.
 */
export const startResearchSchema = z.object({
  query: z
    .string()
    .min(10, "Query must be at least 10 characters")
    .max(1000, "Query must be at most 1000 characters"),
  options: z
    .object({
      enableSteering: z.boolean().optional(),
      maxSources: z.number().int().min(1).max(100).optional(),
      searchAgents: z.array(z.enum(["web", "academic", "github"])).optional(),
    })
    .optional(),
}) satisfies z.ZodType<StartResearchRequest>;

/**
 * Validate query parameters for the `/api/research/history` endpoint.
 */
export const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  offset: z.coerce.number().int().min(0).optional().default(0),
  status: z.enum(["completed", "failed", "all"]).optional().default("all"),
});
