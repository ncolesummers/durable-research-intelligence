# Enterprise Deep Research System

> Transparent, steerable, observable AI-powered multi-agent research platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Bun](https://img.shields.io/badge/Bun-1.3+-000000?logo=bun)](https://bun.sh)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-3178C6?logo=typescript)](https://www.typescriptlang.org)

---

## 🎯 Core Values

This system is built on four foundational pillars:

### 1. **Transparency**
Every step, query, and LLM call is logged and visible. Users can see exactly what the system is doing at every stage of the research process.

### 2. **Steerability**
Real-time human-in-the-loop intervention allows researchers to guide the research direction mid-execution through steering commands.

### 3. **Observability**
Complete tracking of costs, performance, and quality metrics at every stage. Full visibility into system behavior and resource usage.

### 4. **Comprehensive Testing**
>80% test coverage requirement across unit, integration, and E2E tests ensures reliability and quality.

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Bun 1.3+** - [Install Bun](https://bun.sh)
- **Node.js 20+** - [Install Node.js](https://nodejs.org)
- **PostgreSQL** - [Neon](https://neon.tech) recommended for serverless
- **Ollama** - [Install Ollama](https://ollama.ai) with required models:
  ```bash
  ollama pull deepseek-r1
  ollama pull qwen3
  ```

### Installation

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/next-enterprise-intelligence.git
cd next-enterprise-intelligence

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Generate and apply database migrations
bun db:generate
bun db:push

# Start development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Development Commands

```bash
bun dev              # Start development server
bun build            # Build for production
bun start            # Start production server
bun test             # Run Bun test suite
bun test --coverage  # Run tests with coverage
bun check            # Biome lint/format check
bun format           # Auto-fix formatting issues
bun db:generate      # Generate database migrations
bun db:push          # Apply migrations to database
bun db:studio        # Open Drizzle Studio
```

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 USER (Researcher)                       │
│           Browser → React 19.2 UI                       │
└──────────────────────┬──────────────────────────────────┘
                       ↓ HTTPS/WSS
┌─────────────────────────────────────────────────────────┐
│             VERCEL EDGE/FUNCTIONS                       │
│  API Routes (Next.js 16) + Auth (Supabase)             │
└──────────────────────┬──────────────────────────────────┘
                       ↓
┌─────────────────────────────────────────────────────────┐
│          VERCEL WORKFLOWS (Durable Engine)              │
│                                                         │
│  Master Research Workflow:                             │
│    1. DECOMPOSITION (DeepSeek-R1)                      │
│    2. STEERING CHECKPOINT (Optional)                   │
│    3. PARALLEL SEARCH (Web, Academic, GitHub)          │
│    4. SYNTHESIS (Qwen3)                                │
│    5. FINALIZATION                                     │
└──────────────────────┬──────────────────────────────────┘
                       ↓
         ┌─────────────┴─────────────┬──────────────┐
         ↓                           ↓              ↓
┌────────────────┐      ┌─────────────────┐  ┌──────────────┐
│   PostgreSQL   │      │    Supabase     │  │Ollama Server │
│   (Neon)       │      │    (Auth)       │  │(Self-Hosted) │
└────────────────┘      └─────────────────┘  └──────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES                          │
│  Tavily (Web) | arXiv (Academic) | GitHub API           │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Runtime** | Bun 1.3 | Fast JavaScript runtime, package manager |
| **Framework** | Next.js 16 (App Router) | React framework with server components |
| **Language** | TypeScript 5.5+ (strict) | Type-safe development |
| **UI** | React 19.2 + Tailwind CSS 4.0 | Modern component-based UI |
| **Components** | shadcn/ui | Accessible, customizable components |
| **Database** | Neon Postgres | Serverless PostgreSQL |
| **ORM** | Drizzle ORM | Type-safe database queries |
| **Auth** | Supabase Auth | Email/password authentication |
| **AI/LLM** | Vercel AI SDK v6 | Multi-provider LLM abstraction |
| **Workflows** | @vercel/workflow@4.0+ | Durable workflow execution |
| **LLM Providers** | Ollama (primary), Gemini 2.5 Flash (fallback) | Self-hosted + cloud LLMs |
| **Search APIs** | Tavily, arXiv, GitHub | Web, academic, code search |
| **Testing** | Bun Test + MSW + Playwright | Unit, integration, E2E tests |
| **Linting** | Biome | Fast linter and formatter |
| **Real-Time** | Server-Sent Events (SSE) + WebSocket | Live progress and steering |
| **Charts** | Recharts | Observability dashboards |

---

## 📂 Project Structure

```
next-enterprise-intelligence/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   └── research/      # Research endpoints
│   │   ├── (auth)/            # Auth pages (login, signup)
│   │   ├── dashboard/         # Main dashboard
│   │   └── admin/             # Admin panel
│   │
│   ├── workflows/             # Vercel Workflows (durable execution)
│   │   └── research/
│   │       ├── master.ts      # Main workflow orchestrator
│   │       └── agents/        # Search agents (web, academic, GitHub)
│   │
│   ├── lib/                   # Shared libraries
│   │   ├── db/               # Database (Drizzle schema, migrations)
│   │   ├── ai/               # LLM providers and utilities
│   │   ├── steering/         # Steering command logic
│   │   └── utils/            # Helper functions
│   │
│   └── components/            # React components
│       ├── ui/               # shadcn/ui components
│       ├── research/         # Research-specific components
│       └── admin/            # Admin dashboard components
│
├── tests/                     # Bun tests
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests (MSW mocks)
│   └── e2e/                  # Playwright E2E tests
│
├── .github/                   # GitHub configuration
│   └── ISSUE_TEMPLATE/       # Issue templates
│
├── public/                    # Static assets
├── biome.json                # Biome configuration
├── drizzle.config.ts         # Drizzle ORM configuration
├── next.config.ts            # Next.js configuration
├── tsconfig.json             # TypeScript configuration
├── PRD.md                    # Product Requirements Document
├── DATA_MODELS.md            # Database & API specifications
└── CONTRIBUTING.md           # Development guidelines
```

---

## 🔐 Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Database
DATABASE_URL="postgresql://..."  # Neon Postgres connection string

# Auth (Supabase)
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# LLM Providers
OLLAMA_BASE_URL="http://localhost:11434/v1"  # Your Ollama server
GOOGLE_GENERATIVE_AI_API_KEY="..."          # Gemini fallback (optional)

# Search APIs
TAVILY_API_KEY="..."                         # Tavily web search
GITHUB_TOKEN="ghp_..."                       # GitHub personal access token

# Vercel (auto-populated in production)
VERCEL_URL="your-app.vercel.app"
VERCEL_ENV="production"
```

See `.env.example` for a complete template with descriptions.

---

## 💡 Key Features

### Phase 1: MVP (Weeks 1-6)

- **F1: Research Workflow Execution** - Query decomposition → parallel search → synthesis
- **F2: Real-Time Streaming** - Server-Sent Events for live progress updates
- **F3: Human-in-the-Loop Steering** - WebSocket commands to guide research mid-execution
- **F4: Trajectory Logging** - Complete audit trail of every workflow step
- **F5: Authentication** - Supabase email/password authentication
- **F6: Markdown Export** - Download formatted research reports

### Phase 2: Enhancements (Weeks 7-8)

- **F7: Observability Dashboards** - Metrics, charts, cost tracking
- **F8: Session History** - View and re-export past research
- **F9: Rate Limiting & Quotas** - Cost control and abuse prevention

---

## 📊 Workflow

A typical research session follows this flow:

```
1. User submits research query
   ↓
2. DECOMPOSITION: Query broken into 5-8 sub-queries (DeepSeek-R1)
   ↓
3. STEERING CHECKPOINT: User can optionally guide research direction
   ↓
4. PARALLEL SEARCH: 3 agents run concurrently
   - Web Search (Tavily)
   - Academic Papers (arXiv)
   - GitHub Repositories
   ↓
5. SYNTHESIS: Findings combined into Markdown report (Qwen3)
   ↓
6. EXPORT: User downloads final research report
```

All steps are logged to the database for complete transparency and debugging.

---

## 💰 Cost Structure

**Target:** <$60/month | **Actual:** $39-44/month

### Fixed Costs
- Vercel Pro: $20/month
- Neon Postgres (Scale): $19/month
- Supabase: $0/month (free tier)

### Variable Costs
- Tavily: $0/month (1,000 searches/month free)
- arXiv: $0/month (unlimited, rate-limited)
- GitHub API: $0/month (5,000 req/hour free)
- Ollama: $0/month (self-hosted)
- Gemini 2.5 Flash: $0-5/month (fallback only)

**Cost Optimization:** 95%+ of LLM inference runs on self-hosted Ollama.

---

## 📚 Documentation

- **[PRD.md](./PRD.md)** - Complete Product Requirements Document
  - Product vision, core values, user flows
  - System architecture and design patterns
  - Feature requirements and success metrics
  - 6-8 week development timeline

- **[DATA_MODELS.md](./DATA_MODELS.md)** - Technical specifications
  - Complete database schema (4 tables)
  - API endpoint specifications (7 endpoints)
  - TypeScript type definitions
  - Example SQL queries

- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Developer guide
  - Development setup and workflow
  - Code standards and testing requirements
  - Pull request process
  - How to add new features

---

## 🧪 Testing

This project maintains >80% test coverage across all layers:

```bash
# Run all tests
bun test

# Run with coverage report
bun test --coverage

# Run specific test file
bun test src/lib/db/utils.test.ts

# Watch mode (re-run on changes)
bun test --watch
```

### Test Structure

- **Unit Tests (60%)** - Individual functions and utilities
- **Integration Tests (30%)** - Workflows with mocked external APIs (MSW)
- **E2E Tests (10%)** - Full user journeys with Playwright

All new features require corresponding tests before merging.

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines on:

- Development setup and workflow
- Code standards and linting (Biome)
- Testing requirements
- Pull request process
- Adding new features

**Quick Start for Contributors:**

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/123-my-feature`
3. Make your changes with tests
4. Run `bun check && bun test`
5. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Vercel AI SDK](https://sdk.vercel.ai/)
- Inspired by [Salesforce Enterprise Deep Research](https://github.com/salesforce/enterprise-deep-research)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Powered by [Ollama](https://ollama.ai/) for self-hosted LLMs

---

## 📞 Support

- **Documentation:** See `PRD.md` and `DATA_MODELS.md`
- **Issues:** [GitHub Issues](https://github.com/YOUR_USERNAME/next-enterprise-intelligence/issues)
- **Discussions:** [GitHub Discussions](https://github.com/YOUR_USERNAME/next-enterprise-intelligence/discussions)

---

**Built with ❤️ for transparent, steerable, and observable AI research**
