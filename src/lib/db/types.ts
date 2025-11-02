/**
 * TypeScript helpers inferred from the Drizzle schema.
 */

import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import type {
  researchSessions,
  sources,
  steeringEvents,
  trajectorySteps,
} from "./schema";

/**
 * Type exports inferred from database schema
 * These types are automatically derived from the schema definitions
 */

export type ResearchSession = InferSelectModel<typeof researchSessions>;
export type NewResearchSession = InferInsertModel<typeof researchSessions>;

export type Source = InferSelectModel<typeof sources>;
export type NewSource = InferInsertModel<typeof sources>;

export type TrajectoryStep = InferSelectModel<typeof trajectorySteps>;
export type NewTrajectoryStep = InferInsertModel<typeof trajectorySteps>;

export type SteeringEvent = InferSelectModel<typeof steeringEvents>;
export type NewSteeringEvent = InferInsertModel<typeof steeringEvents>;

/**
 * Status types for type safety
 */
export type SessionStatus =
  | "pending"
  | "decomposing"
  | "searching"
  | "steering_wait"
  | "synthesizing"
  | "completed"
  | "failed";

export type SourceType = "web" | "academic" | "github";

export type AgentType =
  | "master"
  | "web_search"
  | "academic_search"
  | "github_search";

export type StepName =
  | "decomposition"
  | "search_web"
  | "search_academic"
  | "search_github"
  | "synthesis";

export type StepStatus = "success" | "failed" | "retried";

export type SteeringCommand =
  | "add_source"
  | "exclude_topic"
  | "change_direction"
  | "force_stop"
  | "continue";
