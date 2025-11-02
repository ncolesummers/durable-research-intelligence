/**
 * Database client wiring for Drizzle + Neon.
 */

import { neonConfig, Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Configure Neon to use HTTP connection for serverless environments
neonConfig.webSocketConstructor = undefined; // Disable WebSocket for serverless

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

/**
 * Shared Drizzle ORM instance backed by Neon.
 */
export const db = drizzle(pool, { schema });

// Export all table schemas for use in other modules
export {
  researchSessions,
  sources,
  steeringEvents,
  trajectorySteps,
} from "./schema";
