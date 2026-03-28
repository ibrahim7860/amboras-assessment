# Store Analytics Dashboard

## Project Overview

Multi-tenant eCommerce analytics dashboard for Amboras. Store owners can view real-time business metrics (revenue, conversion rates, top products, recent activity) scoped to their store.

## Tech Stack

- **Backend:** NestJS (TypeScript), TypeORM, PostgreSQL, Redis
- **Frontend:** Next.js (App Router, TypeScript), Recharts, TailwindCSS
- **Infrastructure:** Docker Compose (Postgres 16 + Redis 7)
- **Load Testing:** Grafana k6

## Project Structure

```
monterrey/
├── backend/           # NestJS API (port 3001)
│   └── src/
│       ├── analytics/ # Analytics module — overview, top-products, recent-activity, SSE stream
│       ├── auth/      # JWT auth — login, guards, decorators
│       ├── events/    # Event entity + ingestion
│       ├── products/  # Product entity
│       └── seed/      # Seed script + live event simulator
├── frontend/          # Next.js app (port 3000)
│   └── src/
│       ├── app/       # App router — /login, /dashboard
│       ├── components/# KpiCard, RevenueChart, TopProductsTable, RecentActivityFeed, etc.
│       ├── hooks/     # useAnalytics, useTopProducts, useRecentActivity, useEventSource
│       └── lib/       # API client, auth context/helpers
├── loadtest/          # k6 load testing scripts
│   ├── scenarios/     # baseline, stress, ingestion, multi-tenant
│   └── helpers/       # auth, config
└── docker-compose.yml # Postgres + Redis
```

## Architecture Patterns

### Multi-Tenancy
- Shared schema with `store_id` column on all tables
- JWT carries `storeId` — extracted by AuthGuard, attached to every request
- All repository queries MUST filter by `store_id` — never return unscoped data
- Row-level isolation, not schema or DB-level

### Data Aggregation (Hybrid)
- **Historical data (week/month):** Read from `daily_store_metrics` pre-computed summary table
- **Today's data:** Query `events` table directly with indexes (low row count per store per day)
- **Custom date ranges:** Query `daily_store_metrics` for the date range
- Pre-computed metrics are populated by the seed script and updated incrementally by the simulator

### Caching
- Redis response cache with short TTL (30-60s)
- Cache keys: `overview:{storeId}:{period}:{dateRange}`, `top-products:{storeId}:{period}`
- Recent activity is NOT cached (needs to feel real-time)

### Real-time (SSE)
- New events published to Redis Pub/Sub channel per store (`events:{storeId}`)
- SSE endpoint subscribes to the channel and pushes to connected frontend clients
- Frontend `useEventSource` hook appends new events to the activity feed

## Database

### Tables
- `events` — raw event stream (event_id PK, store_id, event_type, timestamp, data JSONB)
- `daily_store_metrics` — pre-computed daily aggregates per store (revenue, page_views, purchases, etc.)
- `products` — product catalog per store (product_id PK, store_id, name, price, category)
- `users` — auth accounts (id, email, password bcrypt, store_id, name)

### Key Indexes
- `events(store_id, timestamp DESC)` — recent activity queries
- `events(store_id, event_type, timestamp)` — aggregation queries
- `events(store_id, timestamp) WHERE event_type = 'purchase'` — partial index for revenue
- `daily_store_metrics(store_id, date)` — UNIQUE, for historical lookups

## API Endpoints

All endpoints require JWT auth via `Authorization: Bearer <token>` header.

- `POST /api/v1/auth/login` — Returns JWT
- `GET /api/v1/analytics/overview?period=today|week|month` — Aggregate metrics
- `GET /api/v1/analytics/top-products?period=today|week|month&limit=10` — Top products by revenue
- `GET /api/v1/analytics/recent-activity?limit=20` — Latest events
- `GET /api/v1/analytics/events/stream` — SSE real-time event stream

## Commands

```bash
# Infrastructure
docker-compose up -d          # Start Postgres + Redis

# Backend
cd backend
npm install
npm run seed                  # Seed database with sample data
npm run start:dev             # Start NestJS dev server (port 3001)
npm run simulate              # Start live event simulator

# Frontend
cd frontend
npm install
npm run dev                   # Start Next.js dev server (port 3000)

# Load Testing
brew install k6               # Install k6 (one-time)
k6 run loadtest/scenarios/baseline.js      # Baseline load test
k6 run loadtest/scenarios/stress.js        # Stress test (10x)
k6 run loadtest/scenarios/ingestion.js     # Write throughput test
k6 run loadtest/scenarios/multi-tenant.js  # Multi-tenant isolation test
```

## Seeded Test Accounts

| Email | Password | Store |
|-------|----------|-------|
| alice@techstore.com | password123 | TechStore (store_001) |
| bob@fashionhub.com | password123 | FashionHub (store_002) |
| carol@homecraft.com | password123 | HomeCraft (store_003) |

## Code Conventions

- NestJS modules follow domain-driven structure: each module has its own controller, service, entity, and DTOs
- Use `class-validator` decorators for all DTO validation
- All analytics service methods accept `storeId` as first parameter — never rely on implicit scoping
- Frontend components are in PascalCase, hooks prefixed with `use`
- TypeScript strict mode enabled in both backend and frontend
- Environment variables loaded via `@nestjs/config` (backend) and `next.config.js` (frontend)
