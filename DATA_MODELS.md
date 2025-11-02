# Enterprise Deep Research - Data Models & API Specifications
**Version 2.0** | **Date:** 2025-11-01

---

## Table of Contents
1. [Database Schema](#1-database-schema)
2. [API Specifications](#2-api-specifications)
3. [Type Definitions](#3-type-definitions)

---

## 1. Database Schema

### Overview

```
users (Supabase Auth)
  ↓ 1:N
research_sessions
  ↓ 1:N
  ├─ sources (search results)
  ├─ trajectory_steps (detailed logs)
  └─ steering_events (user interventions)
```

---

### Table: `users`

**Managed by Supabase Auth** (auth.users)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (Supabase-generated) |
| `email` | STRING | User email |
| `created_at` | TIMESTAMP | Account creation time |

---

### Table: `research_sessions`

**Stores high-level research session metadata.**

```typescript
export const researchSessions = pgTable('research_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),

  // Query & workflow
  query: text('query').notNull(),
  workflowId: varchar('workflow_id', { length: 255 }).notNull(),

  // Status tracking
  status: varchar('status', { length: 20 }).notNull().default('pending'),
  // Values: 'pending' | 'decomposing' | 'searching' | 'steering_wait' | 'synthesizing' | 'completed' | 'failed'

  // Timestamps
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),

  // Results
  finalReport: text('final_report'), // Markdown
  sourcesFound: integer('sources_found').default(0),

  // Cost tracking
  tokensUsed: integer('tokens_used').default(0),
  costUSD: decimal('cost_usd', { precision: 10, scale: 4 }).default('0'),

  // Metadata
  metadata: jsonb('metadata'), // { subQueries: [], agentDurations: {}, etc. }
});

// Indexes
export const sessionsByUserIdx = index('sessions_user_idx').on(researchSessions.userId);
export const sessionsByStatusIdx = index('sessions_status_idx').on(researchSessions.status);
```

---

### Table: `sources`

**Stores all sources found during research (URLs, papers, repos).**

```typescript
export const sources = pgTable('sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => researchSessions.id, { onDelete: 'cascade' }),

  // Source details
  url: varchar('url', { length: 2048 }).notNull(),
  title: varchar('title', { length: 500 }),
  snippet: text('snippet'),

  // Classification
  sourceType: varchar('source_type', { length: 50 }).notNull(), // 'web' | 'academic' | 'github'
  agentName: varchar('agent_name', { length: 100 }), // 'web_search_tavily' | 'academic_search_arxiv' | 'github_search'

  // Quality metrics
  relevanceScore: decimal('relevance_score', { precision: 3, scale: 2 }), // 0.00-1.00

  // Metadata
  retrievedAt: timestamp('retrieved_at').defaultNow(),
  metadata: jsonb('metadata'), // { stars: 1234, authors: [...], publishDate: '2024-01-01' }
});

export const sourcesBySessionIdx = index('sources_session_idx').on(sources.sessionId);
```

---

### Table: `trajectory_steps`

**Detailed logging of every workflow step.**

```typescript
export const trajectorySteps = pgTable('trajectory_steps', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => researchSessions.id, { onDelete: 'cascade' }),

  // Step identification
  stepNumber: integer('step_number').notNull(),
  stepName: varchar('step_name', { length: 100 }).notNull(),
  // Values: 'decomposition' | 'search_web' | 'search_academic' | 'search_github' | 'synthesis'
  agentType: varchar('agent_type', { length: 50 }),
  // Values: 'master' | 'web_search' | 'academic_search' | 'github_search'

  // Step data
  input: jsonb('input'), // What went into this step
  output: jsonb('output'), // What came out

  // LLM tracking (if applicable)
  llmModel: varchar('llm_model', { length: 100 }), // 'deepseek-r1' | 'qwen3' | 'gemini-2.5-flash'
  llmProvider: varchar('llm_provider', { length: 50 }), // 'ollama' | 'google'
  tokensPrompt: integer('tokens_prompt'),
  tokensCompletion: integer('tokens_completion'),

  // Performance
  startedAt: timestamp('started_at').notNull(),
  completedAt: timestamp('completed_at'),
  latencyMs: integer('latency_ms'), // Computed: completedAt - startedAt

  // Status
  status: varchar('status', { length: 20 }).notNull().default('success'),
  // Values: 'success' | 'failed' | 'retried'
  errorMessage: text('error_message'),
});

export const trajectoryBySessionIdx = index('trajectory_session_idx').on(trajectorySteps.sessionId);
```

---

### Table: `steering_events`

**Logs all user steering commands.**

```typescript
export const steeringEvents = pgTable('steering_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => researchSessions.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),

  // Command details
  command: varchar('command', { length: 50 }).notNull(),
  // Values: 'add_source' | 'exclude_topic' | 'change_direction' | 'force_stop' | 'continue'

  payload: jsonb('payload').notNull(),
  // Examples:
  // { instruction: "Also search GitHub for 'langchain alternatives'" }
  // { excludeTerms: ['cryptocurrency', 'NFT'] }
  // { newDirection: "Focus more on pricing strategies" }

  // Tracking
  appliedAt: timestamp('applied_at').defaultNow(),
  appliedSuccessfully: boolean('applied_successfully').default(true),
  workflowStepApplied: integer('workflow_step_applied'), // Which step number saw this command
});

export const steeringBySessionIdx = index('steering_session_idx').on(steeringEvents.sessionId);
```

---

## 2. API Specifications

### **POST /api/research/start**

Create new research session and trigger workflow.

**Request:**
```typescript
interface StartResearchRequest {
  query: string; // Required, 10-1000 chars
  options?: {
    enableSteering?: boolean; // Default: true
    maxSources?: number; // Default: 30, max: 100
    searchAgents?: ('web' | 'academic' | 'github')[]; // Default: all
  };
}
```

**Response:**
```typescript
interface StartResearchResponse {
  sessionId: string; // UUID
  workflowId: string; // Vercel Workflow ID
  status: 'pending';
  createdAt: string; // ISO timestamp
}
```

**Status Codes:**
- `201 Created`: Session started successfully
- `400 Bad Request`: Invalid query or options
- `401 Unauthorized`: Missing/invalid auth token
- `429 Too Many Requests`: Rate limit exceeded

---

### **GET /api/research/[id]/status**

Poll for current session status.

**Response:**
```typescript
interface SessionStatusResponse {
  sessionId: string;
  status: 'pending' | 'decomposing' | 'searching' | 'steering_wait' | 'synthesizing' | 'completed' | 'failed';
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
```

---

### **GET /api/research/[id]/stream** (Server-Sent Events)

Real-time streaming updates during workflow execution.

**Response Format:** `text/event-stream`

**Event Types:**

```typescript
// Event: step_started
data: {
  stepName: "decomposition",
  stepNumber: 1,
  timestamp: "2025-11-01T10:00:00Z"
}

// Event: step_completed
data: {
  stepName: "decomposition",
  stepNumber: 1,
  output: { subQueries: ["query 1", "query 2"] },
  latencyMs: 2500,
  timestamp: "2025-11-01T10:00:02Z"
}

// Event: source_found
data: {
  url: "https://example.com/article",
  title: "Example Article",
  sourceType: "web",
  agentName: "general_web_search",
  timestamp: "2025-11-01T10:00:05Z"
}

// Event: steering_ready
data: {
  message: "Query decomposed. You can now steer the research direction.",
  waitTimeoutSeconds: 300
}

// Event: steering_applied
data: {
  command: "add_source",
  payload: { instruction: "Also search GitHub" },
  timestamp: "2025-11-01T10:01:00Z"
}

// Event: completed
data: {
  sessionId: "uuid",
  finalReport: "# Research Report\n\n...",
  sourcesFound: 23,
  tokensUsed: 12500,
  costUSD: "0.0125",
  totalDurationSeconds: 180
}

// Event: error
data: {
  message: "Tavily API rate limit exceeded",
  failedStep: "search_web",
  retryable: true
}
```

---

### **POST /api/research/[id]/steer** (WebSocket)

Send real-time steering commands during workflow execution.

**WebSocket URL:** `wss://your-app.vercel.app/api/research/[id]/steer`

**Message Format:**
```typescript
interface SteerCommand {
  command: 'add_source' | 'exclude_topic' | 'change_direction' | 'force_stop' | 'continue';
  payload: {
    instruction?: string; // For add_source, change_direction
    excludeTerms?: string[]; // For exclude_topic
  };
}
```

**Examples:**

```typescript
// Add additional search directive
{
  command: 'add_source',
  payload: { instruction: "Also search GitHub for 'langchain alternatives'" }
}

// Exclude topics
{
  command: 'exclude_topic',
  payload: { excludeTerms: ['cryptocurrency', 'NFT', 'blockchain'] }
}

// Change research direction
{
  command: 'change_direction',
  payload: { instruction: "Focus more on open-source solutions and pricing" }
}

// Force stop (skip remaining searches)
{
  command: 'force_stop',
  payload: {}
}

// Continue (no changes)
{
  command: 'continue',
  payload: {}
}
```

**Server Response:**
```typescript
interface SteerAcknowledgement {
  acknowledged: boolean;
  appliedAt: string; // ISO timestamp
  message: string; // "Command 'add_source' applied successfully"
}
```

---

### **GET /api/research/[id]/export**

Export research report as Markdown file.

**Response:**
- **Content-Type**: `text/markdown`
- **Content-Disposition**: `attachment; filename="research-{sessionId}.md"`

**Markdown Format:**
```markdown
# Research Report: {Original Query}

**Generated:** {ISO timestamp}
**Sources Found:** {count}
**Duration:** {seconds}s
**Cost:** ${costUSD}

---

## Summary
{AI-generated executive summary}

## Key Findings
{Main findings with citations}

## Detailed Analysis
{Full synthesis from LLM}

---

## Sources

### Web Sources
1. [{Title}]({URL}) - {snippet}

### Academic Papers
1. [{Title}]({arXiv URL}) - {authors} - {year}

### GitHub Repositories
1. [{Repo Name}]({GitHub URL}) - ⭐ {stars} - {description}

---

## Research Trajectory

**Step 1: Query Decomposition**
- Sub-query 1: ...
- Sub-query 2: ...

**Step 2: Search Execution**
- Web Search: {count} sources in {duration}ms
- Academic Search: {count} papers in {duration}ms
- GitHub Search: {count} repos in {duration}ms

**Step 3: Synthesis**
- Model: {LLM model}
- Tokens: {tokens used}
- Duration: {duration}ms

---

*Generated by Enterprise Deep Research System*
*Tokens: {tokensUsed} | Cost: ${costUSD}*
```

---

### **GET /api/research/history**

Get user's research session history.

**Query Parameters:**
- `limit` (default: 20, max: 100)
- `offset` (default: 0)
- `status` (filter: 'completed' | 'failed' | 'all')

**Response:**
```typescript
interface ResearchHistoryResponse {
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
```

---

## 3. Type Definitions

### Core Workflow Types

```typescript
// Workflow Options
interface WorkflowOptions {
  enableSteering?: boolean;
  maxSources?: number;
  searchAgents?: ('web' | 'academic' | 'github')[];
}

// Workflow Result
interface WorkflowResult {
  sessionId: string;
  report: string; // Markdown
  sourcesFound: number;
  durationSeconds: number;
  tokensUsed: number;
  costUSD: string;
}

// Sub-Query
interface SubQuery {
  id: number;
  text: string;
}

// Source
interface Source {
  url: string;
  title: string;
  snippet: string;
  sourceType: 'web' | 'academic' | 'github';
  agentName: string;
  relevanceScore: number;
  metadata?: {
    stars?: number; // GitHub
    authors?: string[]; // Academic
    publishedDate?: string; // Web/Academic
    language?: string; // GitHub
  };
}

// Trajectory Step
interface TrajectoryStep {
  sessionId: string;
  stepNumber: number;
  stepName: string;
  agentType?: string;
  input: any;
  output: any;
  llmModel?: string;
  llmProvider?: string;
  tokensPrompt?: number;
  tokensCompletion?: number;
  startedAt: Date;
  completedAt?: Date;
  latencyMs?: number;
  status: 'success' | 'failed' | 'retried';
  errorMessage?: string;
}

// Steering Command
interface SteerCommand {
  command: 'add_source' | 'exclude_topic' | 'change_direction' | 'force_stop' | 'continue';
  payload: {
    instruction?: string;
    excludeTerms?: string[];
    newDirection?: string;
  };
}

// Steering Event
interface SteeringEvent {
  sessionId: string;
  userId: string;
  command: string;
  payload: any;
  appliedAt: Date;
  appliedSuccessfully: boolean;
  workflowStepApplied?: number;
}
```

---

### LLM Types

```typescript
// LLM Provider Config
interface LLMProviderConfig {
  provider: 'ollama' | 'google';
  model: string;
  baseURL?: string;
  apiKey?: string;
}

// LLM Usage
interface LLMUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// LLM Response
interface LLMResponse {
  text: string;
  usage: LLMUsage;
  model: string;
  provider: string;
}
```

---

### Search Agent Types

```typescript
// Search Result (Generic)
interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  relevanceScore?: number;
  metadata?: Record<string, any>;
}

// Tavily Search Result
interface TavilyResult {
  url: string;
  title: string;
  content: string;
  score: number;
  publishedDate?: string;
}

// arXiv Search Result
interface ArxivPaper {
  id: string; // arXiv URL
  title: string;
  summary: string;
  authors: string[];
  published: string;
  categories: string[];
}

// GitHub Search Result
interface GitHubRepo {
  html_url: string;
  full_name: string;
  description: string;
  stargazers_count: number;
  forks_count: number;
  language: string;
  updated_at: string;
}
```

---

### Cost Calculation Types

```typescript
// Cost Calculation Input
interface CostInput {
  provider: 'ollama' | 'google';
  model: string;
  promptTokens: number;
  completionTokens: number;
}

// Cost Calculation Output
interface CostOutput {
  costUSD: string; // Formatted to 4 decimal places
  promptCost: string;
  completionCost: string;
}

// Pricing Table (constants)
const LLM_PRICING = {
  ollama: { input: 0, output: 0 }, // Free (self-hosted)
  google: {
    'gemini-2.5-flash': { input: 0.075, output: 0.30 }, // Per 1M tokens
    'gemini-2.5-pro': { input: 1.25, output: 5.00 },
  },
} as const;
```

---

## Appendix: Example Queries

### SQL Query: Get Session with Full Trajectory

```sql
SELECT
  rs.id,
  rs.query,
  rs.status,
  rs.final_report,
  rs.sources_found,
  rs.tokens_used,
  rs.cost_usd,
  rs.started_at,
  rs.completed_at,
  -- Trajectory steps
  json_agg(
    json_build_object(
      'stepNumber', ts.step_number,
      'stepName', ts.step_name,
      'latencyMs', ts.latency_ms,
      'status', ts.status
    ) ORDER BY ts.step_number
  ) as trajectory
FROM research_sessions rs
LEFT JOIN trajectory_steps ts ON rs.id = ts.session_id
WHERE rs.id = '{session_id}'
GROUP BY rs.id;
```

---

### SQL Query: Cost Breakdown by Agent

```sql
SELECT
  ts.agent_type,
  COUNT(*) as executions,
  SUM(ts.tokens_prompt + ts.tokens_completion) as total_tokens,
  AVG(ts.latency_ms) as avg_latency_ms
FROM trajectory_steps ts
WHERE ts.session_id = '{session_id}'
  AND ts.agent_type IS NOT NULL
GROUP BY ts.agent_type;
```

---

### SQL Query: Top Users by Cost

```sql
SELECT
  u.email,
  COUNT(rs.id) as total_sessions,
  SUM(rs.sources_found) as total_sources,
  SUM(rs.tokens_used) as total_tokens,
  SUM(rs.cost_usd) as total_cost_usd
FROM users u
LEFT JOIN research_sessions rs ON u.id = rs.user_id
WHERE rs.status = 'completed'
GROUP BY u.email
ORDER BY total_cost_usd DESC
LIMIT 20;
```

---

## Conclusion

This document provides complete data models, API specifications, and type definitions for the Enterprise Deep Research system. Use these as reference when implementing database schemas, API routes, and TypeScript types.

**See also:** `PRD.md` for high-level product requirements and architecture.
