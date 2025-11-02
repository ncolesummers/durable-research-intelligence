# Contributing to Enterprise Deep Research

Thank you for your interest in contributing! This guide will help you get started with development.

---

## 🚀 Getting Started

### Fork & Clone

```bash
# Fork the repository on GitHub
# Then clone your fork
git clone https://github.com/YOUR_USERNAME/next-enterprise-intelligence.git
cd next-enterprise-intelligence

# Add upstream remote
git remote add upstream https://github.com/ORIGINAL_OWNER/next-enterprise-intelligence.git
```

### Development Setup

#### 1. Install Dependencies

```bash
bun install
```

#### 2. Set Up Database

You can use either Neon (recommended) or local PostgreSQL:

**Option A: Neon (Serverless)**
```bash
# Sign up at https://neon.tech
# Create a new project
# Copy connection string to .env.local
```

**Option B: Local PostgreSQL**
```bash
# Install PostgreSQL 15+
# Create database
createdb enterprise_research

# Update .env.local
DATABASE_URL="postgresql://localhost/enterprise_research"
```

#### 3. Set Up Ollama

```bash
# Install Ollama: https://ollama.ai

# Pull required models
ollama pull deepseek-r1
ollama pull qwen3

# Verify models are running
ollama list
```

#### 4. Configure Environment

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your credentials:
# - DATABASE_URL (Neon or local Postgres)
# - Supabase keys (sign up at https://supabase.com)
# - Tavily API key (sign up at https://tavily.com)
# - GitHub token (https://github.com/settings/tokens)
```

#### 5. Run Database Migrations

```bash
# Generate migrations from schema
bun db:generate

# Apply migrations to database
bun db:push

# Optional: Open Drizzle Studio to view database
bun db:studio
```

#### 6. Start Development Server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

---

## 💻 Development Workflow

### Branch Naming

Follow this convention for branch names:

- **Features**: `feature/{issue-number}-{short-description}`
  - Example: `feature/12-synthesis-step`
- **Bug Fixes**: `fix/{issue-number}-{short-description}`
  - Example: `fix/45-steering-timeout`
- **Documentation**: `docs/{description}`
  - Example: `docs/update-readme`
- **Refactoring**: `refactor/{description}`
  - Example: `refactor/trajectory-logging`

### Commit Messages

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Adding/updating tests
- `refactor:` - Code refactoring (no functionality change)
- `chore:` - Tooling, config, dependencies

**Examples:**
```bash
feat(workflow): add steering checkpoint (#18)
fix(api): resolve streaming connection timeout
docs(readme): update installation steps
test(search): add unit tests for academic agent
refactor(db): optimize trajectory query performance
chore(deps): upgrade @vercel/workflow to 4.1
```

### Keeping Your Fork Updated

```bash
# Fetch upstream changes
git fetch upstream

# Merge into your local main
git checkout main
git merge upstream/main

# Push to your fork
git push origin main
```

---

## 📝 Code Standards

### TypeScript

#### Strict Mode
- TypeScript strict mode is **enabled** (see `tsconfig.json`)
- No `any` types (use `unknown` if type is truly unknown)
- Explicit return types for all functions
- Prefer `interface` over `type` for object shapes

**Good:**
```typescript
interface ResearchSession {
  id: string;
  query: string;
  status: SessionStatus;
}

function createSession(query: string): Promise<ResearchSession> {
  // ...
}
```

**Bad:**
```typescript
function createSession(query: any) {  // ❌ No 'any'
  // ...
}  // ❌ Missing return type
```

#### Path Aliases
Use path aliases instead of relative imports:

**Good:**
```typescript
import { db } from '@/lib/db';
import { generateText } from '@/lib/ai/utils';
```

**Bad:**
```typescript
import { db } from '../../../lib/db';
```

#### Naming Conventions
- **Files**: `kebab-case.ts` (e.g., `trajectory-logger.ts`)
- **Components**: `PascalCase.tsx` (e.g., `QueryForm.tsx`)
- **Functions**: `camelCase` (e.g., `executeWorkflow`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_SOURCES`)

### Biome (Linting & Formatting)

We use [Biome](https://biomejs.dev/) for fast linting and formatting.

#### Run Checks

```bash
# Check linting and formatting
bun check

# Auto-fix issues
bun format

# Check specific files
bun check src/lib/db/schema.ts
```

#### Pre-Commit
Biome runs automatically on commit via Git hooks. If checks fail, the commit will be rejected.

#### Configuration
See `biome.json` for rules. Key settings:
- Line width: 100 characters
- Indentation: Tabs (width: 2)
- Quotes: Double quotes
- Semicolons: Always

### React Conventions

#### Server Components by Default
Next.js 16 uses React Server Components by default. Only add `"use client"` when necessary:

```typescript
// Server Component (default)
export default async function DashboardPage() {
  const sessions = await db.query.researchSessions.findMany();
  return <SessionList sessions={sessions} />;
}

// Client Component (interactive state)
"use client";

import { useState } from "react";

export function QueryForm() {
  const [query, setQuery] = useState("");
  // ...
}
```

#### Component Structure
```typescript
// 1. Imports
import { type ReactNode } from "react";

// 2. Types
interface Props {
  children: ReactNode;
}

// 3. Component
export function Layout({ children }: Props) {
  return <div>{children}</div>;
}

// 4. Default export (if needed)
export default Layout;
```

---

## 🧪 Testing Requirements

### Coverage Target

- **Overall**: >80% code coverage
- **Unit Tests**: 60% of test suite
- **Integration Tests**: 30% of test suite
- **E2E Tests**: 10% of test suite

### Running Tests

```bash
# Run all tests
bun test

# Run with coverage report
bun test --coverage

# Run in watch mode (re-run on changes)
bun test --watch

# Run specific test file
bun test src/lib/db/utils.test.ts

# Run E2E tests (Playwright)
bun test:e2e
```

### Writing Tests

#### Test File Naming
Colocate tests next to source files:

```
src/
├── lib/
│   ├── db/
│   │   ├── schema.ts
│   │   ├── utils.ts
│   │   └── utils.test.ts        ← Unit test
├── workflows/
│   └── research/
│       ├── master.ts
│       └── master.integration.test.ts  ← Integration test
tests/
└── e2e/
    └── research-flow.spec.ts    ← E2E test
```

#### Unit Test Example

```typescript
import { describe, it, expect } from "bun:test";
import { parseSubQueries } from "./utils";

describe("parseSubQueries", () => {
  it("should parse numbered list correctly", () => {
    const input = `
1. First query
2. Second query
3. Third query
    `;

    const result = parseSubQueries(input);

    expect(result).toEqual([
      "First query",
      "Second query",
      "Third query",
    ]);
  });

  it("should handle empty input", () => {
    expect(parseSubQueries("")).toEqual([]);
  });
});
```

#### Integration Test Example

Use MSW (Mock Service Worker) to mock external APIs:

```typescript
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { masterResearchWorkflow } from "./master";

// Mock Tavily API
const server = setupServer(
  http.post("https://api.tavily.com/search", () => {
    return HttpResponse.json({
      results: [
        { url: "https://example.com", title: "Test", content: "Snippet" },
      ],
    });
  })
);

beforeAll(() => server.listen());
afterAll(() => server.close());

describe("masterResearchWorkflow", () => {
  it("should complete full workflow successfully", async () => {
    const result = await masterResearchWorkflow(
      "test-session-id",
      "Test query",
      "test-user-id",
      { enableSteering: false }
    );

    expect(result.report).toContain("Research Report");
    expect(result.sourcesFound).toBeGreaterThan(0);
  });
});
```

#### E2E Test Example

```typescript
import { test, expect } from "@playwright/test";

test("should complete full research workflow", async ({ page }) => {
  // Login
  await page.goto("/login");
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="password"]', "password123");
  await page.click('button[type="submit"]');

  // Submit research query
  await page.fill('textarea[name="query"]', "AI coding assistants");
  await page.click('button:has-text("Start Research")');

  // Wait for completion
  await expect(page.locator("text=Research completed")).toBeVisible({
    timeout: 120000,
  });
});
```

### Test Coverage Guidelines

- **All new features** must include tests
- **All bug fixes** must include regression tests
- **Public APIs** (exports) must have >90% coverage
- **Internal utilities** can have lower coverage if trivial

---

## 🗄️ Database Migrations

We use [Drizzle ORM](https://orm.drizzle.team/) for database management.

### Making Schema Changes

1. **Modify Schema**

Edit `src/lib/db/schema.ts`:

```typescript
export const researchSessions = pgTable('research_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  query: text('query').notNull(),
  // Add new column:
  priority: varchar('priority', { length: 20 }).default('normal'),
});
```

2. **Generate Migration**

```bash
bun db:generate
```

This creates a SQL migration file in `src/lib/db/migrations/`.

3. **Review Migration**

Check the generated SQL file to ensure it's correct.

4. **Apply Migration**

```bash
bun db:push
```

This applies the migration to your database.

5. **Commit Both Files**

```bash
git add src/lib/db/schema.ts
git add src/lib/db/migrations/0001_add_priority.sql
git commit -m "feat(db): add priority field to research_sessions"
```

### Database Rules

**DO:**
- ✅ Use Drizzle ORM for all database queries
- ✅ Use parameterized queries (Drizzle does this automatically)
- ✅ Test migrations on local database before pushing
- ✅ Use transactions for multi-step operations

**DON'T:**
- ❌ Modify production database schema directly
- ❌ Skip generating migrations
- ❌ Use raw SQL strings without parameters (SQL injection risk)
- ❌ Delete old migration files

---

## 🔄 Pull Request Process

### Before Creating a PR

Run this checklist:

```bash
# 1. Ensure all tests pass
bun test

# 2. Check linting and formatting
bun check

# 3. Verify coverage is maintained
bun test --coverage

# 4. Build successfully
bun build

# 5. Run E2E tests (if UI changes)
bun test:e2e
```

### Creating a PR

1. **Push your branch** to your fork:
   ```bash
   git push origin feature/123-my-feature
   ```

2. **Open PR** on GitHub

3. **Fill out PR template**:
   - Link related issue: `Closes #123`
   - Describe what changed
   - Add screenshots for UI changes
   - Note any breaking changes

4. **Request review** from maintainers

### PR Review Checklist

Reviewers will check:

- [ ] Tests pass in CI
- [ ] Code coverage maintained (>80%)
- [ ] Biome checks pass
- [ ] No security vulnerabilities introduced
- [ ] Code follows project conventions
- [ ] Documentation updated (if needed)
- [ ] Database migrations tested
- [ ] Breaking changes documented

### After Approval

- PR will be **squashed and merged** into `main`
- Delete your feature branch after merge
- Sync your fork with upstream

---

## ➕ Adding New Features

### Adding a New Search Agent

1. **Create Agent File**

Create `src/workflows/research/agents/{name}-search.ts`:

```typescript
"use workflow";

import { db } from "@/lib/db";
import { trajectorySteps } from "@/lib/db/schema";

export async function runMySearchAgent(
  sessionId: string,
  subQueries: string[],
  maxSources: number = 20
) {
  const sources = [];
  const startTime = Date.now();

  try {
    // Your search logic here
    const results = await fetchFromAPI(subQueries);

    // Transform to common Source format
    const querySources = results.map(result => ({
      url: result.url,
      title: result.title,
      snippet: result.snippet,
      sourceType: "my_agent" as const,
      agentName: "my_search_agent",
      relevanceScore: result.score || 0.5,
    }));

    sources.push(...querySources);

    // Log trajectory
    await db.insert(trajectorySteps).values({
      sessionId,
      stepName: "search_my_agent",
      agentType: "my_search",
      output: { resultsCount: querySources.length },
      latencyMs: Date.now() - startTime,
      status: "success",
    });

    return sources;
  } catch (error) {
    // Log failure
    await db.insert(trajectorySteps).values({
      sessionId,
      stepName: "search_my_agent",
      agentType: "my_search",
      latencyMs: Date.now() - startTime,
      status: "failed",
      errorMessage: error.message,
    });

    return []; // Return empty on failure
  }
}
```

2. **Add to Master Workflow**

Edit `src/workflows/research/master.ts`:

```typescript
import { runMySearchAgent } from "./agents/my-search";

// Add to parallel search tasks
if (enabledAgents.includes('my_agent')) {
  searchTasks.push(runMySearchAgent(sessionId, subQueries, options.maxSources));
}
```

3. **Write Tests**

Create `src/workflows/research/agents/my-search.test.ts`:

```typescript
import { describe, it, expect } from "bun:test";
import { runMySearchAgent } from "./my-search";

describe("runMySearchAgent", () => {
  it("should return sources from API", async () => {
    const sources = await runMySearchAgent("test-id", ["query"], 10);
    expect(sources.length).toBeGreaterThan(0);
  });
});
```

### Adding a New Workflow Step

1. **Add Step to Workflow**

Edit `src/workflows/research/master.ts`:

```typescript
// After existing steps...
const myNewStep = await executeWithLogging(
  sessionId,
  "my_new_step",
  async () => {
    const result = await doSomething();
    return {
      output: { result },
      tokens: { prompt: 0, completion: 0 },
    };
  }
);
```

2. **Update Session Status**

```typescript
await updateSessionStatus(sessionId, "processing_my_step");
```

3. **Emit SSE Event**

```typescript
await emitSSEEvent(sessionId, "step_started", {
  stepName: "my_new_step",
  timestamp: new Date().toISOString(),
});
```

### Adding a New API Endpoint

1. **Create Route File**

Create `src/app/api/{endpoint}/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

// Input validation schema
const RequestSchema = z.object({
  query: z.string().min(10).max(1000),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate input
    const body = await request.json();
    const { query } = RequestSchema.parse(body);

    // Your logic here
    const result = await processQuery(query);

    return NextResponse.json({ result }, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid input", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

2. **Add Auth Middleware** (if needed)

```typescript
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ... rest of handler
}
```

3. **Update `DATA_MODELS.md`**

Document the new endpoint:

```markdown
### **POST /api/{endpoint}**

**Request:**
```typescript
interface Request {
  query: string;
}
```

**Response:**
```typescript
interface Response {
  result: string;
}
```
```

4. **Write Tests**

Create `src/app/api/{endpoint}/route.test.ts`:

```typescript
import { describe, it, expect } from "bun:test";
import { POST } from "./route";

describe("POST /api/{endpoint}", () => {
  it("should return result for valid input", async () => {
    const request = new Request("http://localhost/api/endpoint", {
      method: "POST",
      body: JSON.stringify({ query: "test query" }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.result).toBeDefined();
  });
});
```

---

## 📚 Additional Resources

- **PRD.md** - Product requirements and architecture
- **DATA_MODELS.md** - Database schema and API specs
- **Vercel Workflows Docs** - https://vercel.com/docs/workflow
- **Drizzle ORM Docs** - https://orm.drizzle.team/docs
- **Biome Docs** - https://biomejs.dev/
- **Bun Test Docs** - https://bun.sh/docs/cli/test

---

## ❓ Questions?

- Open a [GitHub Discussion](https://github.com/YOUR_USERNAME/next-enterprise-intelligence/discussions)
- Check existing [Issues](https://github.com/YOUR_USERNAME/next-enterprise-intelligence/issues)
- Review the [PRD](./PRD.md) for architecture details

---

**Thank you for contributing to Enterprise Deep Research!** 🎉
