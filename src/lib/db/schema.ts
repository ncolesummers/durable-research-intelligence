/**
 * Drizzle ORM table definitions for the research workflow domain.
 */

import {
  boolean,
  decimal,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * Research Sessions Table
 * Stores high-level research session metadata
 */
export const researchSessions = pgTable(
  "research_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(), // References Supabase auth.users

    // Query & workflow
    query: text("query").notNull(),
    workflowId: varchar("workflow_id", { length: 255 }).notNull(),

    // Status tracking
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    // Values: 'pending' | 'decomposing' | 'searching' | 'steering_wait' | 'synthesizing' | 'completed' | 'failed'

    // Timestamps
    startedAt: timestamp("started_at").defaultNow(),
    completedAt: timestamp("completed_at"),

    // Results
    finalReport: text("final_report"), // Markdown
    sourcesFound: integer("sources_found").default(0),

    // Cost tracking
    tokensUsed: integer("tokens_used").default(0),
    costUSD: decimal("cost_usd", { precision: 10, scale: 4 }).default("0"),

    // Metadata
    metadata: jsonb("metadata"), // { subQueries: [], agentDurations: {}, etc. }
  },
  (table) => ({
    userIdIdx: index("sessions_user_idx").on(table.userId),
    statusIdx: index("sessions_status_idx").on(table.status),
  }),
);

/**
 * Sources Table
 * Stores all sources found during research (URLs, papers, repos)
 */
export const sources = pgTable(
  "sources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => researchSessions.id, { onDelete: "cascade" }),

    // Source details
    url: varchar("url", { length: 2048 }).notNull(),
    title: varchar("title", { length: 500 }),
    snippet: text("snippet"),

    // Classification
    sourceType: varchar("source_type", { length: 50 }).notNull(), // 'web' | 'academic' | 'github'
    agentName: varchar("agent_name", { length: 100 }), // 'web_search_tavily' | 'academic_search_arxiv' | 'github_search'

    // Quality metrics
    relevanceScore: decimal("relevance_score", { precision: 3, scale: 2 }), // 0.00-1.00

    // Metadata
    retrievedAt: timestamp("retrieved_at").defaultNow(),
    metadata: jsonb("metadata"), // { stars: 1234, authors: [...], publishDate: '2024-01-01' }
  },
  (table) => ({
    sessionIdIdx: index("sources_session_idx").on(table.sessionId),
  }),
);

/**
 * Trajectory Steps Table
 * Detailed logging of every workflow step
 */
export const trajectorySteps = pgTable(
  "trajectory_steps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => researchSessions.id, { onDelete: "cascade" }),

    // Step identification
    stepNumber: integer("step_number").notNull(),
    stepName: varchar("step_name", { length: 100 }).notNull(),
    // Values: 'decomposition' | 'search_web' | 'search_academic' | 'search_github' | 'synthesis'
    agentType: varchar("agent_type", { length: 50 }),
    // Values: 'master' | 'web_search' | 'academic_search' | 'github_search'

    // Step data
    input: jsonb("input"), // What went into this step
    output: jsonb("output"), // What came out

    // LLM tracking (if applicable)
    llmModel: varchar("llm_model", { length: 100 }), // 'deepseek-r1' | 'qwen3' | 'gemini-2.5-flash'
    llmProvider: varchar("llm_provider", { length: 50 }), // 'ollama' | 'google'
    tokensPrompt: integer("tokens_prompt"),
    tokensCompletion: integer("tokens_completion"),

    // Performance
    startedAt: timestamp("started_at").notNull(),
    completedAt: timestamp("completed_at"),
    latencyMs: integer("latency_ms"), // Computed: completedAt - startedAt

    // Status
    status: varchar("status", { length: 20 }).notNull().default("success"),
    // Values: 'success' | 'failed' | 'retried'
    errorMessage: text("error_message"),
  },
  (table) => ({
    sessionIdIdx: index("trajectory_session_idx").on(table.sessionId),
  }),
);

/**
 * Steering Events Table
 * Logs all user steering commands
 */
export const steeringEvents = pgTable(
  "steering_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => researchSessions.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(), // References Supabase auth.users

    // Command details
    command: varchar("command", { length: 50 }).notNull(),
    // Values: 'add_source' | 'exclude_topic' | 'change_direction' | 'force_stop' | 'continue'

    payload: jsonb("payload").notNull(),
    // Examples:
    // { instruction: "Also search GitHub for 'langchain alternatives'" }
    // { excludeTerms: ['cryptocurrency', 'NFT'] }
    // { newDirection: "Focus more on pricing strategies" }

    // Tracking
    appliedAt: timestamp("applied_at").defaultNow(),
    appliedSuccessfully: boolean("applied_successfully").default(true),
    workflowStepApplied: integer("workflow_step_applied"), // Which step number saw this command
  },
  (table) => ({
    sessionIdIdx: index("steering_session_idx").on(table.sessionId),
  }),
);
