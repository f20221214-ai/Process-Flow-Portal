# Architecture Review Process (ARC) Portal — Application Architecture

**Version:** May 2026  
**EA Owner:** Mehak Suri  
**Environment:** Architecture Review Process (Demo)

---

## 1. Overview

The **ARC Portal** is a full-stack TypeScript web application that manages the end-to-end Architecture Review Process within the enterprise. It enables solution teams to submit architecture review requests, supports Enterprise Architects in triaging and scoring those requests, manages Architecture Review Committee (ARC) sessions, records formal decisions, and provides governance analytics across the portfolio.

The application is structured as a **pnpm monorepo** with clearly separated frontend, backend, and shared library packages.

---

## 2. System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         ARC Portal (Browser)                             │
│  React 19 · Vite · TanStack Query · Tailwind CSS · Wouter routing        │
│                                                                          │
│  /           Dashboard         /requests/new     Intake Form             │
│  /requests   Request List      /requests/:id     Request Detail          │
│  /sessions   ARC Sessions      /outcomes         Review Outcomes         │
│  /knowledge-base  Pattern Library    /leanix     Initiatives             │
│  /kpis       KPI Dashboard     /executive-dashboard  Executive View      │
└──────────────────────┬───────────────────────────────────────────────────┘
                       │ REST API  (path-routed proxy)
                       │ /api/*
┌──────────────────────▼───────────────────────────────────────────────────┐
│                        API Server (Express.js / Node.js)                  │
│  Pino logging · Express 5 · esbuild bundle                               │
│                                                                          │
│  /requests        /sessions        /knowledge-base     /outcomes         │
│  /leanix/sync     /jira/sync       /kpis               /admin            │
│  /impact-assessment/analyze        /pattern-recommendations              │
└────────┬──────────────────────┬────────────────────────┬─────────────────┘
         │                      │                        │
┌────────▼────────┐   ┌─────────▼──────────┐   ┌────────▼────────────────┐
│   PostgreSQL    │   │   OpenAI (GPT-5     │   │   External Systems      │
│   (Drizzle ORM) │   │   mini via Replit   │   │   • LeanIX GraphQL API  │
│                 │   │   AI Integration)   │   │   • Jira REST API       │
└─────────────────┘   └────────────────────┘   └─────────────────────────┘
```

### 2.1 Monorepo Package Structure

| Package | Path | Purpose |
|---|---|---|
| `@workspace/arc-portal` | `artifacts/arc-portal/` | React frontend SPA |
| `@workspace/api-server` | `artifacts/api-server/` | Express REST API |
| `@workspace/db` | `lib/db/` | Drizzle ORM schema, migrations, PostgreSQL client |
| `@workspace/api-spec` | `lib/api-spec/` | OpenAPI 3.1 specification |
| `@workspace/api-zod` | `lib/api-zod/` | Zod validation schemas generated from OpenAPI spec |
| `@workspace/api-client-react` | `lib/api-client-react/` | TanStack Query hooks generated from OpenAPI spec |
| `@workspace/integrations-openai-ai-server` | `lib/integrations-openai-ai-server/` | OpenAI client using Replit AI Integrations proxy |

---

## 3. Technology Stack

| Layer | Technology |
|---|---|
| Language | TypeScript (strict, end-to-end) |
| Frontend framework | React 19 |
| Frontend build | Vite |
| Frontend routing | Wouter |
| Frontend state | TanStack Query (server state) |
| Styling | Tailwind CSS 4 |
| UI primitives | Radix UI, shadcn/ui-style components |
| Icons | Lucide React |
| Animations | Framer Motion |
| Charts | Recharts |
| Backend runtime | Node.js |
| Backend framework | Express.js 5 |
| Backend logging | Pino |
| ORM | Drizzle ORM |
| Database | PostgreSQL |
| API contract | OpenAPI 3.1 + Orval code generation |
| Runtime validation | Zod |
| AI | OpenAI GPT-5 mini (via Replit AI Integrations proxy) |
| Workspace | pnpm Workspaces |
| Bundler | esbuild |

---

## 4. Frontend Architecture

### 4.1 Pages and Routes

| Route | Page | Description |
|---|---|---|
| `/` | Dashboard | Pipeline bar chart, headline stats, recent activity |
| `/requests` | Request List | Searchable, filterable list of all ARRs |
| `/requests/new` | Request Form | 37-question intake form with AI-assisted impact scoring |
| `/requests/:id` | Request Detail | Full request view, EA triage panel, AI recommendations, workflow timeline |
| `/knowledge-base` | Pattern Library | Searchable directory of patterns and best practices |
| `/knowledge-base/:id` | Pattern Detail | Full pattern view with technology tags and external links |
| `/knowledge-base/new` | Pattern Form | Create/edit knowledge base articles |
| `/leanix` | Initiatives | LeanIX and Jira initiative sync view |
| `/sessions` | ARC Sessions | Schedule and manage ARC review meetings |
| `/outcomes` | Review Outcomes | Browse and record ARC committee decisions |
| `/kpis` | KPI Dashboard | Operational metrics and target tracking |
| `/executive-dashboard` | Executive Dashboard | Governance health, cycle times, approval rates |
| `/process-guide` | Process Guide | Documentation for the ARC review phases |
| `/admin` | Admin | Demo setup and data seeding tools |

### 4.2 Key Components

| Component | Purpose |
|---|---|
| `layout.tsx` | Sidebar navigation, top search header, page chrome |
| `workflow-timeline.tsx` | Status visualiser: Intake → Triage → ARC Review → Decision |
| `SolutionContextCard` | Renders Q1–Q4 contextual questions on the intake form |
| `ImpactQuestionCard` | Renders a scored impact domain (Security / Data / Integration / Regulatory / AI) |
| `OperationalReadinessCard` | Renders Q34–Q37 Yes/No questions with conditional detail fields |
| `DerivedImpactCard` | Displays AI-derived impact level + risk rationale per domain |
| `StatCard` | Single-metric summary tile used on the Dashboard |
| UI primitives | `Badge`, `Card`, `Table`, `Tabs`, `Dialog`, `Select`, `Calendar`, `Command`, `Chart` |

---

## 5. Backend Architecture

### 5.1 API Routes

All routes are mounted at the `/api` prefix.

| Route | Methods | Description |
|---|---|---|
| `/requests` | `GET`, `POST` | List and create Architecture Review Requests |
| `/requests/:id` | `GET`, `PATCH` | Retrieve or update a single ARR (status, EA triage, impact scores) |
| `/requests/:id/pattern-recommendations` | `GET` | Suggest relevant KB articles using keyword/tag scoring |
| `/sessions` | `GET`, `POST` | List and create ARC sessions |
| `/sessions/:id` | `GET`, `PATCH`, `DELETE` | Manage a single session |
| `/outcomes` | `GET`, `POST` | List and create review outcomes |
| `/outcomes/:id` | `GET`, `PATCH` | Manage a single outcome |
| `/knowledge-base` | `GET`, `POST` | List and create knowledge base articles |
| `/knowledge-base/:id` | `GET`, `PATCH`, `DELETE` | Manage a single article |
| `/knowledge-base/:id/link-requests` | `POST` | Link an article to one or more requests |
| `/kpis` | `GET`, `PATCH` | Retrieve and update KPI metrics |
| `/leanix/sync` | `POST` | Pull initiatives from the LeanIX GraphQL API |
| `/jira/sync` | `POST` | Pull epics/initiatives from Jira |
| `/impact-assessment/analyze` | `POST` | Send 37-question answers to OpenAI; receive 6-domain impact scoring |
| `/admin/seed` | `POST` | Seed demo data |

### 5.2 AI-Assisted Impact Assessment Flow

```
Browser (request-form.tsx)
  │
  ├─ User answers Q1–Q4  (Solution Context — non-scored)
  ├─ User answers Q5–Q9  (Security — 5 questions)
  ├─ User answers Q10–Q16 (Data — 7 questions)
  ├─ User answers Q17–Q20 (Integration — 4 questions)
  ├─ User answers Q21–Q25 (Regulatory — 5 questions)
  ├─ User answers Q26–Q33 (AI/ML — 8 questions)
  └─ User answers Q34–Q37 (Operational Readiness — 4 Yes/No)
          │
          ▼
  POST /api/impact-assessment/analyze
          │
          ▼  (buildSection + buildContextSection + buildOperationalSection)
  GPT-5 mini → JSON with 6 × { level, details }:
    securityImpactLevel / securityImpactDetails
    dataImpactLevel / dataImpactDetails
    integrationImpactLevel / integrationImpactDetails
    regulatoryImpactLevel / regulatoryImpactDetails
    aiImpactLevel / aiImpactDetails
    operationalImpactLevel / operationalImpactDetails
          │
          ▼
  derive-ai-risk-flags.ts (deterministic, no AI):
    q2 (Q27 sourcing)    → "Custom/open-source model" flag
    q3 (Q28 data)        → "Personal data used in AI" flag
    q4 (Q29 decisions)   → "Automated decisions — limited oversight" flag
    q8 (Q33 monitoring)  → "No monitoring plan" flag
          │
          ▼
  POST /api/requests  (full payload with all domain answers + EA baseline)
```

### 5.3 EA Baseline Derivation (`deriveEaBaseline`)

On every `POST /requests`, the server deterministically pre-fills the EA triage fields based on the submitter's impact levels:

- **EA Risk/Complexity Ratings** — one per domain (security, data, integration, regulatory, AI, operational)
- **EA Overall Complexity & Risk Level** — aggregated from all six domain ratings
- **EA Review Type** — None / Lightweight / Standard / Full Board
- **EA Required Architecture Views** — e.g. Security, Data, Operational Architecture
- **EA Required SMEs** — e.g. Security Architect, DBA, Platform Engineer
- **EA ARC Schedule** — advisory turnaround window

---

## 6. Data Entities and Relationships

### 6.1 Entity–Relationship Overview

```
jira_initiatives                    leanix_initiatives
     │                                      │
     │ (jira_initiative_id)                 │ (no direct FK, name-matched)
     │                                      │
     └─────────────┬────────────────────────┘
                   │
          ┌────────▼────────────────────────────────┐
          │          architecture_requests           │  ◄── core entity
          │  (1 request : 0..n sessions)             │
          │  (1 request : 0..n outcomes)             │
          │  (1 request : 0..n kb_articles via join) │
          └──┬───────────────────────────────────────┘
             │
      ┌──────┴──────┬──────────────────────┐
      │             │                      │
┌─────▼──────┐  ┌───▼──────────┐  ┌───────▼─────────────┐
│ arc_sessions│  │review_outcomes│  │  request_kb_articles │
│            │  │               │  │  (join table)        │
│session_id ─┼──►  session_id  │  │  request_id  ───────►│
└────────────┘  └───────────────┘  │  article_id  ───────►│
                                   └──────────────────────┘
                                            │
                                   ┌────────▼─────────────┐
                                   │ knowledge_base_articles│
                                   └──────────────────────┘

conversations ──(1:n)──► messages
kpi_metrics   (standalone — no FK)
```

### 6.2 Entity Detail

#### `architecture_requests` — Core Request Record

| Field Group | Key Columns | Description |
|---|---|---|
| Identity | `id`, `title`, `description`, `business_unit`, `submitted_by`, `request_type` | Who submitted what |
| Ownership | `sponsor_product_owner`, `solution_architect`, `ea_assignee` | People accountable |
| Metadata | `status`, `priority`, `phase`, `created_at`, `updated_at` | Lifecycle state |
| Scope | `business_capability`, `business_criticality`, `deployment_model`, `in_scope_regions`, `expected_user_base`, `target_go_live_date` | Initiative scope |
| Context Answers | `context_answers` (JSON) | Q1–Q4 solution context (non-scored) |
| Impact Levels | `security_impact_level`, `data_impact_level`, `integration_impact_level`, `regulatory_impact_level`, `ai_impact_level`, `operational_impact_level` | AI-derived per-domain level: none/low/medium/high |
| Impact Details | `security_impact_details` … `operational_impact_details` | AI rationale narrative per domain |
| Impact Answers | `security_impact_answers` … `operational_impact_answers` (JSON) | Full questionnaire answers stored per domain |
| EA Baseline | `ea_security_risk_rating`, `ea_data_complexity_rating`, `ea_integration_complexity_rating`, `ea_regulatory_risk_rating`, `ea_ai_risk_rating`, `ea_operational_risk_rating` | Per-domain EA pre-triage ratings |
| EA Decision | `ea_overall_complexity`, `ea_overall_risk_level`, `ea_review_type` | Aggregated EA guidance |
| EA Planning | `ea_required_architecture_views`, `ea_required_smes`, `ea_arc_schedule` | Who needs to review and by when |
| Integration | `jira_initiative_id`, `jira_key` | Link to Jira epic/initiative |

#### `arc_sessions` — ARC Committee Meetings

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `request_id` | integer | → `architecture_requests.id` |
| `scheduled_date` | timestamp | |
| `duration` | integer | Minutes (default 75) |
| `status` | text | scheduled / completed / cancelled |
| `attendees` | text (JSON array) | |
| `notes` | text | |

#### `review_outcomes` — ARC Decisions

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `request_id` | integer | → `architecture_requests.id` |
| `session_id` | integer | → `arc_sessions.id` (nullable) |
| `decision` | text | Approved / Rejected / Deferred / Exception Granted |
| `outcome_type` | text | Type classification |
| `adr_reference` | text | Architecture Decision Record link |
| `exception_owner` | text | Who owns a granted exception |
| `remediation_plan` | text | |
| `risk_owner` | text | |
| `next_steps` | text | |
| `created_by` | text | |

#### `knowledge_base_articles` — Pattern & Best Practice Library

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `title` | text | |
| `category` | text | best_practice / reference_architecture / decision_record / etc. |
| `tags` | text (JSON array) | Keyword tags for recommendation matching |
| `technologies` | text (JSON array) | Technology names |
| `content` | text | Markdown body |
| `external_url` | text | Confluence / Notion / GitHub link |
| `owner` | text | Responsible architect |
| `status` | text | published / draft / archived |

#### `request_kb_articles` — Request ↔ Pattern Join

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `request_id` | integer | → `architecture_requests.id` |
| `article_id` | integer | → `knowledge_base_articles.id` |
| Unique | | Composite unique on `(request_id, article_id)` |

#### `jira_initiatives` — Jira Sync Cache

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `jira_key` | text (unique) | e.g. PROJ-123 |
| `summary`, `description` | text | |
| `project_key`, `project_name` | text | |
| `status`, `priority`, `issue_type` | text | |
| `assignee`, `labels`, `jira_url` | text | |
| `synced_at` | timestamp | Last sync timestamp |

#### `leanix_initiatives` — LeanIX Sync Cache

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `leanix_id` | text (unique) | LeanIX fact sheet UUID |
| `name`, `description` | text | |
| `lifecycle`, `status`, `responsible` | text | |
| `tags`, `leanix_url` | text | |
| `synced_at` | timestamp | |

#### `kpi_metrics` — Governance KPIs

| Column | Type | Notes |
|---|---|---|
| `id` | serial PK | |
| `outcome_number`, `outcome_name` | integer / text | Business outcome grouping |
| `kpi_category`, `kpi_name` | text | |
| `what_to_measure`, `how_to_measure` | text | |
| `current_value`, `target_value`, `unit` | text | |
| `status` | text | not_started / on_track / at_risk / achieved |
| `notes`, `updated_by` | text | |

#### `conversations` + `messages` — Chat (AI Assistant)

| Entity | Key Columns | Notes |
|---|---|---|
| `conversations` | `id`, `title`, `created_at` | Chat session container |
| `messages` | `id`, `conversation_id` (FK → conversations, cascade delete), `role`, `content`, `created_at` | Individual chat turns |

---

## 7. External Integrations

| System | Direction | Mechanism | Key Config |
|---|---|---|---|
| **OpenAI** | Outbound (API call) | Replit AI Integrations proxy; `gpt-5-mini` model | `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY` |
| **LeanIX** | Inbound sync | GraphQL API; `Project` fact sheet type; triggered via `/api/leanix/sync` | `LEANIX_WORKSPACE`, `LEANIX_API_TOKEN` |
| **Jira** | Inbound sync | REST API; Epic/Initiative issues; triggered via `/api/jira/sync` | Jira credentials via env vars |
| **PostgreSQL** | Internal | Drizzle ORM, connection pooling | `DATABASE_URL` |

---

## 8. Request Lifecycle State Machine

```
submitted ──► in_triage ──► pending_arc ──► approved
                │                │
                │                ├──► rejected
                │                └──► deferred
                └──► (abandoned)
```

**Phase tracking** runs in parallel:

```
ph1 (Intake) ──► ph2 (EA Triage) ──► ph3 (ARC Review) ──► ph4 (Decision)
```

---

## 9. Security Considerations

- All API calls proxied through Replit's mTLS-secured reverse proxy; no direct port exposure
- Secrets (`LEANIX_API_TOKEN`, `DATABASE_URL`, OpenAI keys) held in Replit environment secrets — never in source code
- No user authentication in the current demo build; EA user identity (`Mehak Suri`) is hardcoded for demonstration purposes
- AI-derived impact assessments are advisory only; final EA ratings require human review and approval

---

## 10. Key Design Decisions

| Decision | Rationale |
|---|---|
| OpenAPI + Orval code generation | Single source of truth for request/response shapes; eliminates frontend/backend type drift |
| Drizzle ORM with explicit migrations | Type-safe SQL; migration files version-controlled alongside schema |
| Deterministic EA baseline on submit | Gives EA a pre-populated triage starting point without blocking the submitter |
| Questionnaire answers stored as JSON columns | Preserves full fidelity for future reviewer UIs without schema churn per question |
| AI risk flags derived deterministically | Structured flags (e.g. "No monitoring plan") are computed from stored option values — not re-inferred from AI — ensuring consistency and testability |
| 37-question Excel set as canonical source | All frontend option labels and backend prompt criteria reference verbatim Excel text so AI scoring is calibrated to the same vocabulary as the user's selections |
