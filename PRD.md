# Enterprise Deep Research - Product Requirements Document
**Version 2.0** | **Date:** 2025-11-01 | **Status:** Approved for Implementation

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Core Values & Philosophy](#2-core-values--philosophy)
3. [User Flows](#3-user-flows)
4. [System Architecture](#4-system-architecture)
5. [Feature Requirements](#5-feature-requirements)
6. [Technical Approach](#6-technical-approach)
7. [Success Metrics](#7-success-metrics)
8. [Development Timeline](#8-development-timeline)
9. [Cost & Infrastructure](#9-cost--infrastructure)

---

## 1. Executive Summary

### Product Vision
Build a **transparent, steerable, observable** AI-powered multi-agent deep research system using TypeScript, Vercel Workflows, and self-hosted LLMs. The system replicates Salesforce's Enterprise Deep Research architecture while maintaining cost efficiency (<$60/month) and full observability of the research process.

### Target Users
- **Primary**: 1-5 internal researchers/developers (prototype phase)
- **Future**: Expand to team-wide (20-50 users) after validation

### Core Differentiation
Unlike black-box AI research tools, this system provides:
- **Full transparency**: Every step, query, and LLM call logged and visible
- **Real-time steering**: Researchers can intervene mid-research to guide direction
- **Complete observability**: Track costs, performance, quality at every stage
- **Comprehensive testing**: Quality assurance through multi-level test coverage

### Key Constraints
- **Budget**: <$75/month total spend
- **Scale**: Prototype for 1-5 users initially
- **Timeline**: 6-8 weeks to production
- **Infrastructure**: Self-hosted Ollama for primary inference

---

## 2. Core Values & Philosophy

### The Four Pillars

#### 1. **Transparency**
> "Users should see exactly what the system is doing at every step"

**What This Means:**
- Log every workflow step (decomposition, search queries, synthesis)
- Record all LLM calls (model, tokens, latency, cost)
- Display sources with retrieval timestamps and relevance scores
- Show research trajectory in chronological order
- Expose internal state during execution

**Anti-Pattern:** Black box AI that provides results without explanation

---

#### 2. **Steerability**
> "Researchers should control the research process, not just accept results"

**What This Means:**
- Real-time intervention during workflow execution
- Steering commands: add sources, exclude topics, change direction, force stop
- WebSocket connection for immediate command transmission
- Workflow reacts to steering within seconds
- User sees confirmation of steering actions applied

**Anti-Pattern:** Fire-and-forget research where user has no control after submission

---

#### 3. **Observability**
> "System behavior, performance, and costs must be measurable and monitorable"

**What This Means:**
- Vercel's built-in observability (logs, analytics, workflow traces)
- Custom metrics dashboards (research volume, agent performance, costs)
- Per-session cost tracking (token usage → USD conversion)
- Performance monitoring (latency per agent, total workflow duration)
- Error tracking with full context (failed step, retry attempts, error messages)

**Anti-Pattern:** Systems where you can't debug failures or understand cost drivers

---

#### 4. **Comprehensive Testing**
> "Quality and reliability must be validated at every layer"

**What This Means:**
- **Unit Tests**: Individual functions (decomposition logic, search parsers)
- **Integration Tests**: Complete workflows with mocked external APIs
- **E2E Tests**: Full user journeys (login → research → export)
- **Benchmark Validation**: Output quality checks (source count, citation accuracy)
- Target: >80% code coverage, all critical paths tested

**Anti-Pattern:** "Move fast and break things" without quality validation

---

## 3. User Flows

### Primary Flow: Research Session

```
1. LOGIN
   User → Email/Password → Supabase Auth → Dashboard

2. START RESEARCH
   User → Enter query (10-1000 chars)
        → Configure options:
           - Enable steering? (default: true)
           - Max sources (default: 30)
           - Search agents (web, academic, github)
        → Click "Start Research"

3. REAL-TIME STREAMING
   System → Displays live progress:
            - "Decomposing query..." (DeepSeek-R1, 2-5s)
            - "Sub-queries: 1) X, 2) Y, 3) Z..."
            - "Searching web..." (Tavily, 5-10s)
            - "Searching academic papers..." (arXiv, 10-15s)
            - "Searching GitHub..." (GitHub API, 5-10s)
            - Sources appear in real-time (title, URL, snippet)

4. STEERING CHECKPOINT (if enabled)
   System → Pauses workflow
          → Shows: "Query decomposed. Add any directions?"
   User → (Optional) Send steering commands:
          - "Also search GitHub for 'langchain alternatives'"
          - "Exclude cryptocurrency topics"
          - "Focus on open-source solutions"
        → Click "Continue" or wait 5min timeout

5. SYNTHESIS
   System → "Synthesizing report..." (Qwen3, 15-30s)
          → Displays final report (Markdown)
          → Shows metadata:
             - Sources found: 34
             - Duration: 43s
             - Cost: $0.0245
             - Tokens: 12,500

6. EXPORT
   User → Click "Export Markdown"
        → Downloads: research-{sessionId}.md
```

---

### Secondary Flow: View History

```
1. NAVIGATE
   User → Dashboard → "History" tab

2. VIEW SESSIONS
   System → Displays table:
            - Query
            - Status (completed/failed)
            - Sources found
            - Date
            - Cost

3. VIEW DETAILS
   User → Click session
        → View full report
        → See trajectory timeline
        → Re-export if needed
```

---

### Admin Flow: Observability Dashboard

```
1. ACCESS
   User → Dashboard → "Admin" (auth: admin role)

2. VIEW METRICS
   System → Displays charts:
            - Research volume (sessions/day, 30-day trend)
            - Agent performance (avg latency, failure rate)
            - LLM usage (tokens by model, cost breakdown)
            - User activity (top users, total sessions)

3. INVESTIGATE FAILURES
   User → Click failed session
        → View trajectory steps
        → See error details
        → Identify root cause
```

---

## 4. System Architecture

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER (Researcher)                        │
│         Browser → React 19.2 UI + WebSocket                 │
└────────────────────────┬────────────────────────────────────┘
                         ↓ HTTPS/WSS
┌─────────────────────────────────────────────────────────────┐
│                  VERCEL EDGE/FUNCTIONS                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │ API Routes   │  │ Auth         │  │ SSE/WebSocket    │  │
│  │ (Next.js 16) │  │ (Supabase)   │  │ (Real-time)      │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│             VERCEL WORKFLOWS (Durable Engine)               │
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │         Master Research Workflow                   │    │
│  │                                                     │    │
│  │  Step 1: DECOMPOSITION                            │    │
│  │    Input: "Analyze AI coding assistants market"   │    │
│  │    LLM: DeepSeek-R1 (Ollama)                      │    │
│  │    Output: 5-8 sub-queries                        │    │
│  │                                                     │    │
│  │  Step 2: STEERING CHECKPOINT                      │    │
│  │    Wait for user commands (5min timeout)          │    │
│  │    Apply: add queries, exclude topics, etc.       │    │
│  │                                                     │    │
│  │  Step 3: PARALLEL SEARCH (3 agents)               │    │
│  │    - General Web (Tavily API)                     │    │
│  │    - Academic Papers (arXiv API)                  │    │
│  │    - GitHub Repos (GitHub API)                    │    │
│  │    Combine: 20-40 sources total                   │    │
│  │                                                     │    │
│  │  Step 4: SYNTHESIS                                │    │
│  │    Input: All sources + original query            │    │
│  │    LLM: Qwen3 (Ollama)                           │    │
│  │    Output: 500-2000 word Markdown report         │    │
│  │                                                     │    │
│  │  Step 5: FINALIZATION                             │    │
│  │    Save report, calculate costs, emit completion  │    │
│  └────────────────────────────────────────────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         ↓
         ┌───────────────┴───────────────┬────────────────┐
         ↓                               ↓                ↓
┌────────────────┐          ┌─────────────────┐  ┌────────────────┐
│ PostgreSQL     │          │ Supabase        │  │ Ollama Server  │
│ (Neon Scale)   │          │ (Free Tier)     │  │ (Self-Hosted)  │
│                │          │                 │  │                │
│ - Sessions     │          │ - Auth          │  │ - DeepSeek-R1  │
│ - Sources      │          │ - File Storage  │  │ - Qwen3        │
│ - Trajectories │          │   (Reports)     │  │ - gpt-oss      │
│ - Steering     │          └─────────────────┘  └────────────────┘
└────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                         │
│  - Tavily (Web Search)      - Free: 1k/mo                   │
│  - arXiv (Academic)         - Free: Unlimited               │
│  - GitHub (Code/Repos)      - Free: 5k req/hr               │
│  - Gemini 2.5 Flash         - Fallback if Ollama down       │
└─────────────────────────────────────────────────────────────┘
```

---

### Workflow State Machine

```
START
  ↓
DECOMPOSING (DeepSeek-R1)
  ↓
STEERING_WAIT (optional, 5min timeout)
  ↓
SEARCHING (3 parallel agents)
  ↓
SYNTHESIZING (Qwen3)
  ↓
COMPLETED
  ↓
[Export available]
```

**Error Handling:**
- Any step failure → Mark session as FAILED
- Log error to trajectory_steps
- Retry logic: 3 attempts with exponential backoff
- Fallback LLM: If Ollama fails, use Gemini 2.5 Flash

---

## 5. Feature Requirements

### Phase 1: MVP (Weeks 1-6)

#### **F1: Research Workflow Execution**
- [ ] Accept research query (10-1000 characters)
- [ ] Decompose query into 5-8 sub-queries using DeepSeek-R1
- [ ] Execute 3 parallel search agents (web, academic, GitHub)
- [ ] Synthesize findings into Markdown report using Qwen3
- [ ] Save all results to Postgres database
- **Success Criteria**: End-to-end workflow completes in <90 seconds

---

#### **F2: Real-Time Streaming**
- [ ] Server-Sent Events (SSE) for live progress updates
- [ ] Stream events: step_started, source_found, step_completed, error
- [ ] Frontend displays live progress (progress bar, source list)
- [ ] No page refresh required
- **Success Criteria**: User sees sources appear within 1 second of discovery

---

#### **F3: Human-in-the-Loop Steering**
- [ ] Steering checkpoint after decomposition
- [ ] WebSocket connection for real-time commands
- [ ] 5 command types: add_source, exclude_topic, change_direction, force_stop, continue
- [ ] 5-minute timeout if no user action
- [ ] Log all steering events to database
- **Success Criteria**: Steering command applied within 2 seconds

---

#### **F4: Trajectory Logging**
- [ ] Log every workflow step (name, input, output, duration)
- [ ] Record all LLM calls (model, tokens, cost)
- [ ] Track all sources found (URL, agent, relevance)
- [ ] Save steering events with timestamps
- **Success Criteria**: 100% of workflow actions logged to Postgres

---

#### **F5: Authentication**
- [ ] Email/password signup via Supabase Auth
- [ ] JWT session management
- [ ] Protected API routes (middleware)
- [ ] User profile page
- **Success Criteria**: Only authenticated users can create research sessions

---

#### **F6: Markdown Export**
- [ ] Format report with citations, sources, trajectory
- [ ] Download as .md file
- [ ] Include metadata (cost, duration, sources count)
- **Success Criteria**: Clean, readable Markdown that renders correctly in any viewer

---

### Phase 2: Enhancements (Weeks 7-8)

#### **F7: Observability Dashboards**
- [ ] Research volume chart (sessions/day)
- [ ] Agent performance metrics (latency, failures)
- [ ] LLM usage breakdown (tokens, costs by model)
- [ ] User activity table (top users, total cost)
- **Success Criteria**: Admin can identify cost trends and performance bottlenecks

---

#### **F8: Session History**
- [ ] List all past research sessions
- [ ] Filter by status (completed/failed)
- [ ] Re-export old reports
- [ ] View full trajectory for any session
- **Success Criteria**: User can find any past research within 3 clicks

---

#### **F9: Rate Limiting & Quotas**
- [ ] Per-user session limits (10/day for free tier)
- [ ] API rate limiting (per-endpoint)
- [ ] Cost tracking per user
- [ ] Alert if user exceeds quota
- **Success Criteria**: System prevents abuse, costs stay predictable

---

## 6. Technical Approach

### Technology Stack

#### **Core Framework**
- **Runtime**: Bun 1.3
- **Framework**: Next.js 16 (App Router, React Server Components)
- **Language**: TypeScript 5.5+ (strict mode)
- **React**: 19.2

#### **AI & Workflows**
- **AI SDK**: Vercel AI SDK v6 (multi-provider abstraction)
- **Durable Workflows**: `@vercel/workflow@4.0+`
- **LLM Providers**: Ollama (primary), Google Gemini 2.5 Flash (fallback)

#### **Database & Storage**
- **Database**: Neon Postgres (serverless, Scale tier $19/mo)
- **ORM**: Drizzle ORM (type-safe, Bun-compatible)
- **Auth**: Supabase Auth (email/password, JWT)
- **File Storage**: Supabase Storage (Markdown exports)

#### **Search APIs**
- **Web**: Tavily API (free: 1k searches/month)
- **Academic**: arXiv API (free, unlimited with rate limits)
- **GitHub**: GitHub REST API (free: 5k req/hour)

#### **Frontend**
- **Styling**: Tailwind CSS 4.0
- **Components**: shadcn/ui (accessible, customizable)
- **Real-Time**: SSE + WebSocket
- **Markdown**: react-markdown + remark-gfm
- **Charts**: Recharts (for dashboards)

#### **Testing**
- **Unit/Integration**: Vitest + MSW (API mocking)
- **E2E**: Playwright
- **Coverage**: Target >80%

#### **Observability**
- **Logs**: Vercel Logs (structured JSON logging)
- **Analytics**: Vercel Analytics (web vitals, sessions)
- **Workflow Traces**: Vercel Workflow dashboard
- **Custom Metrics**: Postgres queries + Recharts dashboards

---

### Key Design Patterns

#### **1. Durable Agent Pattern**
Vercel Workflows provide automatic retries and state persistence. Each workflow step is fault-tolerant.

#### **2. Multi-Agent Orchestration**
Master workflow coordinates 3 specialized search agents that run in parallel (Promise.all).

#### **3. Event-Driven Streaming**
Workflow emits events (SSE) at each step. Frontend subscribes and updates UI in real-time.

#### **4. Human-in-the-Loop Checkpoint**
Workflow pauses at steering checkpoint, waits for WebSocket commands, then continues.

#### **5. Comprehensive Audit Trail**
Every action logged to Postgres (trajectory_steps table) for full transparency and debugging.

---

### Security Practices

#### **Input Validation**
- Zod schemas for all API inputs
- Sanitize user queries before LLM prompts
- Validate steering commands (whitelist)

#### **Authentication**
- Supabase JWT tokens for all API routes
- Middleware enforces auth on protected endpoints
- Role-based access (admin vs. user)

#### **SQL Injection Prevention**
- Drizzle ORM parameterized queries
- No raw SQL strings

#### **XSS Protection**
- Sanitize Markdown output before rendering
- react-markdown with safe defaults

#### **Rate Limiting**
- Per-user quotas (10 sessions/day)
- Per-endpoint rate limits (100 req/min)

---

## 7. Success Metrics

### MVP Launch Criteria (Week 6)

| Metric | Target |
|--------|--------|
| **Workflow Completion Rate** | >90% of sessions complete successfully |
| **End-to-End Latency** | <90 seconds (query → report) |
| **Source Quality** | ≥10 sources per session, <10% duplicates |
| **Report Quality** | 500-2000 words, ≥80% sources cited |
| **Test Coverage** | >80% (unit + integration + E2E) |
| **Monthly Cost** | <$60 |
| **Steering Response Time** | Commands applied within 2 seconds |
| **Trajectory Logging** | 100% of steps logged to database |

---

### Post-Launch KPIs (Week 8+)

| Metric | Target |
|--------|--------|
| **Active Users** | 3-5 users (prototype phase) |
| **Sessions/User/Week** | 5-10 |
| **User Satisfaction** | >4/5 on feedback survey |
| **Steering Adoption** | >50% of sessions use steering |
| **Failure Rate** | <10% of sessions fail |
| **Cost per Session** | <$0.50 |

---

## 8. Development Timeline

### 6-8 Week Roadmap

| Week | Milestone | Key Deliverables |
|------|-----------|------------------|
| **1** | Foundation | Backend API, Ollama integration, database setup |
| **2** | Core Workflow | Working research workflow (decomposition + search) |
| **3** | Synthesis & UI | End-to-end flow (query → report → export) |
| **4** | Streaming & Steering | Real-time UI + human-in-the-loop steering |
| **5** | Observability | Metrics dashboards, Vercel integration |
| **6** | Testing & Quality | 80%+ coverage, performance optimization, security |
| **7-8** | Deployment & Refinement | Production launch, beta user testing, polish |

---

### Week-by-Week Breakdown

#### **Week 1: Foundation**
- Project setup (Next.js 16, TypeScript, Bun)
- Database schema + migrations (Drizzle ORM)
- Supabase Auth integration
- Ollama provider configuration
- API routes (start, status, history)
- **Deliverable**: Backend infrastructure ready

---

#### **Week 2: Core Workflow**
- Master workflow implementation (Vercel Workflows)
- Query decomposition (DeepSeek-R1)
- 3 search agents (Tavily, arXiv, GitHub)
- Parallel execution (Promise.all)
- Trajectory logging
- **Deliverable**: Complete workflow (decomposition → search → logging)

---

#### **Week 3: Synthesis & UI**
- Synthesis step (Qwen3)
- Frontend dashboard (query form, history)
- Authentication flow (login/signup)
- Markdown export endpoint
- **Deliverable**: End-to-end flow working (submit → report → export)

---

#### **Week 4: Streaming & Steering**
- SSE endpoint (real-time streaming)
- Frontend event listeners (live progress)
- Steering checkpoint in workflow
- WebSocket endpoint (steering commands)
- Steering panel UI
- **Deliverable**: Streaming UI + steering functional

---

#### **Week 5: Observability**
- Admin metrics dashboard (Recharts)
- Vercel Analytics + Speed Insights integration
- Structured logging
- Workflow traces testing
- **Deliverable**: Full observability stack

---

#### **Week 6: Testing & Quality**
- Unit tests (80%+ coverage)
- Integration tests (workflow + APIs)
- E2E tests (Playwright, critical paths)
- Performance optimization (indexes, caching)
- Security hardening (input validation, rate limiting)
- **Deliverable**: Production-ready, tested codebase

---

#### **Weeks 7-8: Deployment & Refinement**
- Deploy to Vercel production
- Beta user onboarding (1-3 users)
- Collect feedback, fix bugs
- UI/UX improvements
- Final polish, documentation
- **Deliverable**: Production system with active users

---

## 9. Cost & Infrastructure

### Monthly Cost Breakdown

| Service | Tier | Cost | Notes |
|---------|------|------|-------|
| **Vercel** | Pro | $20/mo | Serverless functions, workflows, edge |
| **Neon Postgres** | Scale | $19/mo | 8GB storage, autoscaling compute |
| **Supabase** | Free | $0/mo | Auth + storage (under limits) |
| **Tavily** | Free | $0/mo | 1k searches/month |
| **arXiv** | Free | $0/mo | Unlimited (rate limited) |
| **GitHub API** | Free | $0/mo | 5k req/hour |
| **Ollama** | Self-hosted | $0/mo | Primary inference (90%+) |
| **Gemini 2.5 Flash** | Pay-as-you-go | $0-5/mo | Fallback only (5-10% usage) |
| **TOTAL** | | **$39-44/mo** | ✅ Under $60 budget |

---

### Cost Optimization Strategy

1. **Maximize Ollama Usage**: Route 95%+ inference to self-hosted models
2. **Batch Search Queries**: Limit to 3-5 sub-queries per agent to stay under free API tiers
3. **Optimize Token Usage**: Compress prompts, limit synthesis output to 2000 words
4. **Monitor & Alert**: Track daily spend, alert if approaching $50/month

---

### Scaling Projections

| User Count | Sessions/Month | Estimated Cost |
|------------|----------------|----------------|
| 1-5 (MVP) | 50-100 | $40-45/mo |
| 10-20 | 200-400 | $45-55/mo |
| 50-100 | 1000+ | $70-120/mo (need paid API tiers) |

---

## Conclusion

This PRD defines a **lean, prototype-scale** deep research system that prioritizes **transparency, steerability, and observability**. By leveraging self-hosted Ollama for inference and staying within free API tiers, we maintain costs under $60/month while delivering a production-ready system in 6-8 weeks.

**Next Steps:**
1. Review and approve this PRD
2. Scaffold project structure (Cursor 2.0)
3. Follow weekly timeline for implementation
4. Deploy and iterate with beta users

**Ready to build!** 🚀
