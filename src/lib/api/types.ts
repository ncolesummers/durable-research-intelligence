/**
 * TypeScript interfaces that mirror the REST API contracts defined in DATA_MODELS.md.
 */

/**
 * Request payload for starting a research session.
 */
export interface StartResearchRequest {
  query: string; // Required, 10-1000 chars
  options?: {
    enableSteering?: boolean; // Default: true
    maxSources?: number; // Default: 30, max: 100
    searchAgents?: ("web" | "academic" | "github")[]; // Default: all
  };
}

/**
 * Response payload returned after creating a research session.
 */
export interface StartResearchResponse {
  sessionId: string; // UUID
  workflowId: string; // Vercel Workflow ID (placeholder for now)
  status: "pending";
  createdAt: string; // ISO timestamp
}

/**
 * Response payload for fetching the current session status.
 */
export interface SessionStatusResponse {
  sessionId: string;
  status:
    | "pending"
    | "decomposing"
    | "searching"
    | "steering_wait"
    | "synthesizing"
    | "completed"
    | "failed";
  progress: number; // 0-100
  currentStep: string; // Human-readable
  sourcesFound: number;
  elapsedSeconds: number;
  estimatedRemainingSeconds?: number;

  // If status === 'steering_wait'
  steeringPrompt?: {
    message: string;
    suggestedCommands: string[];
  };

  // If status === 'completed'
  finalReport?: string; // Markdown
  tokensUsed?: number;
  costUSD?: string;

  // If status === 'failed'
  error?: {
    message: string;
    failedStep: string;
    retryable: boolean;
  };
}

/**
 * Response payload for paginated research history queries.
 */
export interface ResearchHistoryResponse {
  sessions: Array<{
    id: string;
    query: string;
    status: string;
    sourcesFound: number;
    startedAt: string;
    completedAt?: string;
    costUSD?: string;
  }>;
  total: number;
  hasMore: boolean;
}
