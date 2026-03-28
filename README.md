# Store Analytics Dashboard

A real-time analytics dashboard for Amboras, a multi-tenant eCommerce platform. Store owners can monitor revenue, conversion rates, top-selling products, and live activity — all scoped to their store with sub-second response times.

## Demo

[Video Walkthrough](https://www.loom.com/share/ac16308a9fa8440391b6c8b2dfce834b)

## Setup Instructions

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- (Optional) [Grafana k6](https://k6.io/) for load testing

### Quick Start

```bash
# 1. Start infrastructure (PostgreSQL + Redis)
docker-compose up -d

# 2. Set up backend
cd backend
cp .env.example .env
npm install
npm run seed        # Seeds 3 stores, 60 products, ~500K events
npm run start:dev   # Starts API on http://localhost:3001

# 3. Set up frontend (in a new terminal)
cd frontend
cp .env.example .env
npm install
npm run dev         # Starts dashboard on http://localhost:3000

# 4. (Optional) Start live event simulator
cd backend
npm run simulate    # Generates ~5-10 events/sec for real-time demo
```

### Test Accounts

| Email | Password | Store |
|-------|----------|-------|
| alice@techstore.com | password123 | TechStore |
| bob@fashionhub.com | password123 | FashionHub |
| carol@homecraft.com | password123 | HomeCraft |

---

## Architecture Decisions

### Data Aggregation Strategy

- **Decision:** Hybrid approach — pre-computed daily summary tables for historical data, live queries for today's data.
- **Why:** The requirement is <500ms response time with millions of events. Scanning millions of raw event rows per request won't meet this target. Pre-computing daily aggregates into a `daily_store_metrics` table means historical queries (this week, this month) hit a small summary table instead of the full events table. Today's data is queried live because a single store's single day of events is a small enough dataset to query directly with proper indexes.
- **Trade-offs:**
  - *Gained:* Consistent sub-500ms responses regardless of data volume. Historical queries scale to years of data without degradation.
  - *Sacrificed:* Slight complexity in maintaining two data paths (summary table + live query). Today's metrics are real-time accurate; historical metrics are accurate as of the last pre-computation run.
  - *Alternative considered:* Pure real-time queries with materialized views — simpler but would degrade at scale. Pure batch processing — faster reads but stale data, which hurts the "real-time" feel.

### Real-time vs. Batch Processing

- **Decision:** Hybrid — batch pre-computation for historical aggregates, real-time SSE (Server-Sent Events) for the live activity feed.
- **Why:** Store owners want to see events as they happen (real-time), but they also need accurate historical summaries (batch). SSE provides a lightweight, unidirectional push channel that's perfect for a dashboard — the client only receives data, never sends it.
- **Trade-offs:**
  - *Gained:* Live activity feed updates without page refresh. SSE is simpler than WebSockets (no connection upgrade, auto-reconnect built into browsers, works through most proxies).
  - *Sacrificed:* SSE is unidirectional — if we needed bidirectional communication (e.g., collaborative features), we'd need WebSockets. SSE also has a browser connection limit (~6 per domain), which is fine for a single dashboard but could matter with many tabs.
  - *Alternative considered:* WebSockets (more complex, bidirectional capability we don't need), polling (simpler but wastes bandwidth and adds latency).

### Multi-Tenancy

- **Decision:** Shared schema with `store_id` column on every table, row-level filtering enforced through JWT middleware.
- **Why:** Amboras serves SMB store owners — hundreds to thousands of small tenants. A shared schema is the simplest, cheapest, and most maintainable approach at this scale. It also enables cross-tenant analytics (e.g., platform-wide metrics) with simple queries. There are no compliance or regulatory requirements (HIPAA, FINRA) that would mandate schema or database isolation.
- **Trade-offs:**
  - *Gained:* Single database to manage, simple deployment, easy cross-tenant queries, lowest cost.
  - *Sacrificed:* No hard isolation between tenants (a bug in query scoping could leak data). One tenant's heavy query load can affect others (noisy neighbor).
  - *Migration path:* The `store_id` abstraction already supports tenant graduation:
    - **Tier 1 (Free/Starter):** Shared schema, pooled DB (current implementation)
    - **Tier 2 (Growth/Pro):** Shared DB, isolated PostgreSQL schemas per tenant
    - **Tier 3 (Enterprise/Regulated):** Dedicated DB instance per tenant
  - This is the approach used by Notion, Salesforce, and Stripe — start shared, graduate tenants as they grow or compliance demands it.

### Frontend Data Fetching

- **Decision:** Custom React hooks with SWR for API data fetching, plus a dedicated SSE hook for real-time events.
- **Why:** SWR provides stale-while-revalidate caching, automatic revalidation on focus, and deduplication of requests — all critical for a dashboard that should feel fast and stay fresh. The SSE hook is separate because it's a persistent connection, not a request-response pattern.
- **Trade-offs:**
  - *Gained:* Dashboard feels instant on subsequent visits (cached data shown immediately, revalidated in background). Automatic error retry. Data stays fresh without manual refresh.
  - *Sacrificed:* Extra dependency (SWR). Could have used plain `fetch` in `useEffect` for simplicity, but would lose caching and revalidation.

### Caching Strategy

- **Decision:** Redis response caching with short TTL (30s for overview, 60s for top products). No caching on recent activity.
- **Why:** Analytics data is inherently tolerant of staleness — showing revenue that's 30 seconds old is perfectly acceptable. Redis provides sub-millisecond cache reads, keeping API responses consistently fast even under load. Recent activity is not cached because users expect to see the very latest events.
- **Trade-offs:**
  - *Gained:* Consistent <100ms API responses for cache hits. Reduces database load significantly under concurrent access.
  - *Sacrificed:* Data can be up to 30-60s stale. Cache invalidation complexity if we needed real-time accuracy (we don't for analytics).

### Performance Optimizations

1. **Database indexes:** Composite indexes on `(store_id, timestamp)`, `(store_id, event_type, timestamp)`, and a partial index on purchases for revenue queries.
2. **Pre-computed aggregates:** `daily_store_metrics` table avoids scanning millions of event rows for historical queries.
3. **Redis caching:** Short-TTL response cache eliminates redundant DB queries.
4. **Bulk seeding:** Seed script uses bulk inserts for the ~500K event rows.
5. **Connection pooling:** TypeORM connection pool configured for concurrent access.

---

## API Reference

All endpoints require authentication via `Authorization: Bearer <token>` header.

### Authentication

#### POST /api/v1/auth/login

```json
// Request
{ "email": "alice@techstore.com", "password": "password123" }

// Response
{ "accessToken": "eyJhbG...", "store": { "id": "store_001", "name": "TechStore" } }
```

### Analytics

#### GET /api/v1/analytics/overview

Returns aggregate metrics for the authenticated store.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| period | string | today | `today`, `week`, or `month` |
| startDate | string | — | ISO date for custom range start |
| endDate | string | — | ISO date for custom range end |

```json
// Response
{
  "revenue": { "total": 12500.00, "period": "week" },
  "eventCounts": {
    "page_view": 3200,
    "add_to_cart": 450,
    "remove_from_cart": 80,
    "checkout_started": 200,
    "purchase": 120
  },
  "conversionRate": 3.75
}
```

#### GET /api/v1/analytics/top-products

Returns top products by revenue for the authenticated store.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| period | string | today | `today`, `week`, or `month` |
| limit | number | 10 | Max products to return |

```json
// Response
[
  { "productId": "prod_001", "productName": "Wireless Headphones", "revenue": 2499.50, "unitsSold": 50 },
  { "productId": "prod_002", "productName": "USB-C Hub", "revenue": 1899.00, "unitsSold": 63 }
]
```

#### GET /api/v1/analytics/recent-activity

Returns the most recent events for the authenticated store.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| limit | number | 20 | Max events to return |

```json
// Response
[
  {
    "eventId": "evt_abc123",
    "eventType": "purchase",
    "timestamp": "2026-03-28T10:30:00Z",
    "data": { "productId": "prod_001", "productName": "Wireless Headphones", "amount": 49.99 }
  }
]
```

#### GET /api/v1/analytics/events/stream

Server-Sent Events endpoint. Returns a persistent connection that pushes new events in real-time.

```
event: new-event
data: {"eventId":"evt_xyz","eventType":"purchase","timestamp":"2026-03-28T10:30:05Z","data":{...}}
```

---

## Load Testing

We use [Grafana k6](https://k6.io/) to validate performance beyond the stated requirements.

### Running Load Tests

```bash
# Install k6 (macOS)
brew install k6

# Run individual scenarios
k6 run loadtest/scenarios/baseline.js       # 50 VUs, 2 min — validates current requirements
k6 run loadtest/scenarios/stress.js         # 500 VUs, 3 min — finds breaking points at 10x scale
k6 run loadtest/scenarios/ingestion.js      # Write throughput at 10K-100K events/min
k6 run loadtest/scenarios/multi-tenant.js   # Cross-tenant isolation under concurrent load
```

### Test Scenarios

| Scenario | VUs | Duration | Purpose |
|----------|-----|----------|---------|
| Baseline | 50 | 2 min | Validate p95 <500ms under normal load |
| Stress | 500 | 3 min | Find degradation point at 10x scale |
| Ingestion | Variable | 3 min | Measure write throughput, verify reads stay fast |
| Multi-tenant | 150 (50/store) | 2 min | Verify no cross-tenant data leakage or noisy neighbor |

### Results

> Results will be populated after running the load tests. Example format:

```
Scenario: Baseline (50 VUs, 2 min)
  /api/v1/analytics/overview:
    p50: XXms | p95: XXms | p99: XXms
  /api/v1/analytics/top-products:
    p50: XXms | p95: XXms | p99: XXms
  Errors: 0%
```

---

## Scaling Roadmap

These are optimizations we'd implement as Amboras grows, documented to show the natural evolution of this architecture.

### At 1M events/min (~100x current)

| Optimization | What | Why |
|-------------|------|-----|
| Table partitioning | Partition `events` by month (PostgreSQL native) | Queries only scan relevant partitions; old data archived cheaply |
| Read replicas | Route analytics queries to replicas | Separate read/write load; trivial with TypeORM connection routing |
| Connection pooling | PgBouncer in front of Postgres | Handle thousands of concurrent connections efficiently |

### At 10M events/min (~1000x current)

| Optimization | What | Why |
|-------------|------|-----|
| TimescaleDB | Replace vanilla Postgres | Automatic time-series partitioning, continuous aggregates, built-in compression |
| Kafka | Decouple ingestion from processing | Events go to Kafka; consumers batch-insert + update aggregates async |
| CQRS | Separate read/write models | Write path optimized for ingestion, read path for query performance |

### At 100M+ events/min (planet-scale)

| Optimization | What | Why |
|-------------|------|-----|
| ClickHouse / Druid | OLAP-native analytics DB | Column-oriented storage, sub-second aggregations over billions of rows |
| Flink / Kafka Streams | Streaming aggregation | Real-time continuous aggregation replaces batch pre-computation |
| CDN-level caching | Edge cache for API responses | Sub-10ms globally for dashboards tolerant of 60s staleness |
| Horizontal sharding | Shard by store_id | When single-node DB can't handle write throughput |

---

## Known Limitations

1. **Pre-computed metrics lag:** The `daily_store_metrics` table is populated by the seed script and updated incrementally by the simulator. In production, a background cron job or event-driven worker would keep it current.
2. **No rate limiting:** API endpoints don't have rate limiting. In production, we'd add rate limits per store to prevent abuse.
3. **Simplified auth:** JWT auth with pre-seeded accounts. No registration, password reset, or token refresh flow.
4. **Single database node:** No read replicas or failover. Sufficient for the take-home scope but not production-ready.
5. **SSE connection limits:** Browsers limit ~6 SSE connections per domain. Fine for a single dashboard tab, problematic with many tabs.
6. **No automated metric backfill:** If the daily metrics table gets out of sync, there's no automated reconciliation job.

## What I'd Improve With More Time

1. **Automated metric reconciliation:** A background worker that periodically recalculates `daily_store_metrics` from raw events to catch any drift.
2. **Full auth flow:** Registration, password reset, token refresh, session management.
3. **Dashboard customization:** Let store owners choose which metrics to display, rearrange widgets, save layouts.
4. **Comparison metrics:** "Revenue is up 12% vs. last week" — period-over-period comparisons on KPI cards.
5. **Export functionality:** CSV/PDF export of analytics data for store owners who need reports.
6. **E2E tests:** Playwright tests for the full login → dashboard → filter → real-time flow.
7. **CI/CD pipeline:** GitHub Actions for linting, tests, type checking on every PR.
8. **Monitoring:** Application metrics (request latency, error rate) exported to Prometheus/Grafana.

## Time Spent

Approximately 3 hours.

---

Built for the Amboras Full-Stack Intern take-home assessment.
