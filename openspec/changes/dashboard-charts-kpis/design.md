# Design: Dashboard with Charts & KPIs

## Technical Approach

New `dashboardRepository.ts` with SQL aggregation queries, wired through the existing Repository → IPC → Pinia → View pipeline. A single IPC call returns all 4 KPIs + previous-period equivalents to minimize round-trips. Chart.js registered with tree-shaken components. Dashboard becomes the landing route (`/` → `/dashboard`).

No schema migrations required — all data already exists post-migration `002_dual_pricing`.

## Architecture Decisions

| Decision | Options | Tradeoff | Choice |
|----------|---------|----------|--------|
| KPI fetch granularity | 2 IPC calls (KPIs + trend) vs 1 combined call | Combined saves 1 IPC round-trip but couples concerns | **2 calls** — `getKPIs` and `getRevenueTrend` are independent; trend has different date semantics (always 12-month trailing) |
| Date range computation | Renderer computes vs repository computes | Renderer needs date math for MoM; repo needs ISO strings for SQL | **Renderer sends `{ start, end }` ISO strings** — repo stays a pure SQL executor, renderer owns calendar logic |
| Previous period calculation | SQL self-join vs separate query | Self-join is clever but harder to debug | **Separate query** with offset date range — simpler, matches existing repo patterns |
| Chart library | Chart.js vs ECharts vs Recharts | Chart.js: 60KB, mature, tree-shakeable. ECharts: 800KB+. Recharts: React-only | **chart.js + vue-chartjs** |
| Chart registration | Global vs per-component | Global registers once, but loads all controllers | **Per-component tree-shaking** — register only BarController, CategoryScale, etc. in DashboardView |
| Pending WOs scope | Date-filtered vs snapshot | Spec says snapshot (point-in-time) | **Snapshot** — no date filter on pending count |
| MoM "N/A" handling | null in response vs special string | null is type-safe; string leaks display logic into data | **null** — renderer decides to show "N/A" |

## Data Flow

```
DashboardView.vue
    │
    ├── onMount → store.fetchKPIs(dateRange)
    │                    │
    │                    ├── ipcRenderer.invoke('dashboard:getKPIs', {start, end})
    │                    │         │
    │                    │         └── handlers.ts → dashboardRepository.getKPIs(start, end)
    │                    │                   │
    │                    │                   ├── SQL: SUM(customer_total), SUM(workshop_total) for [start, end]
    │                    │                   ├── SQL: same for [prev_start, prev_end]
    │                    │                   ├── SQL: COUNT WHERE payment_status='pending' (no date filter)
    │                    │                   └── SQL: quote conversion rate for [start, end] + prev period
    │                    │
    │                    └── Returns: DashboardKPIs object
    │
    └── onMount → store.fetchRevenueTrend(endDate)
                         │
                         ├── ipcRenderer.invoke('dashboard:getRevenueTrend', {end})
                         │         │
                         │         └── handlers.ts → dashboardRepository.getRevenueTrend(end)
                         │                   │
                         │                   └── SQL: GROUP BY strftime('%Y-%m', date_in) for 12 months
                         │
                         └── Returns: RevenueTrendPoint[] (12 entries, zero-filled)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/db/repositories/dashboardRepository.ts` | Create | 2 exports: `getKPIs(start, end)`, `getRevenueTrend(endDate)` |
| `src/renderer/views/dashboard/DashboardView.vue` | Create | KPI cards grid, chart, date picker, empty state |
| `src/renderer/stores/dashboard.ts` | Create | Pinia store: `kpis`, `trend`, `loading`, `dateRange`, `fetchKPIs()`, `fetchRevenueTrend()` |
| `src/shared/types.ts` | Modify | Add `DashboardKPIs`, `KPIValue`, `RevenueTrendPoint`, `DateRange` interfaces + `dashboard` on `WrenchifyAPI` |
| `src/main/ipc/handlers.ts` | Modify | Add 2 `ipcMain.handle` calls for `dashboard:getKPIs`, `dashboard:getRevenueTrend` |
| `src/preload/index.ts` | Modify | Add `dashboard` namespace to exposed API |
| `src/renderer/router.ts` | Modify | Change redirect from `/customers` to `/dashboard`, add `/dashboard` route |
| `src/renderer/layouts/MainLayout.vue` | Modify | Add Dashboard as first menu item, import `LayoutDashboard` icon from lucide |
| `src/i18n/it.json` | Modify | Add `dashboard.*` translation keys |
| `src/i18n/es.json` | Modify | Add `dashboard.*` translation keys |

## Interfaces / Contracts

```typescript
// src/shared/types.ts additions

interface DateRange {
  start: string  // ISO date 'YYYY-MM-DD'
  end: string    // ISO date 'YYYY-MM-DD'
}

interface KPIValue {
  current: number
  previous: number | null   // null = no prior period data → show "N/A"
  delta: number | null
  deltaPercent: number | null
}

interface DashboardKPIs {
  profit: KPIValue
  revenue: KPIValue
  pendingWorkOrders: { count: number }
  conversionRate: { rate: number | null }  // null = no quotes in period
}

interface RevenueTrendPoint {
  month: string    // 'YYYY-MM'
  label: string    // localized month label (e.g., "Mar 2026")
  revenue: number
}

// WrenchifyAPI addition:
dashboard: {
  getKPIs: (dateRange: DateRange) => Promise<DashboardKPIs>
  getRevenueTrend: (endDate: string) => Promise<RevenueTrendPoint[]>
}
```

### SQL Queries

**Profit & Revenue** (current period):
```sql
SELECT
  COALESCE(SUM(customer_total), 0) AS revenue,
  COALESCE(SUM(customer_total) - SUM(workshop_total), 0) AS profit
FROM work_orders
WHERE date_in >= ? AND date_in <= ?
```
Same query runs for previous period with offset dates.

**Pending WOs** (snapshot):
```sql
SELECT COUNT(*) AS count FROM work_orders WHERE payment_status = 'pending'
```

**Conversion rate**:
```sql
SELECT
  COUNT(*) AS total,
  SUM(CASE WHEN status IN ('accepted', 'converted') THEN 1 ELSE 0 END) AS converted
FROM quotes
WHERE date >= ? AND date <= ?
```

**Revenue trend** (12 months trailing from endDate):
```sql
SELECT
  strftime('%Y-%m', date_in) AS month,
  COALESCE(SUM(customer_total), 0) AS revenue
FROM work_orders
WHERE date_in >= ? AND date_in <= ?
GROUP BY strftime('%Y-%m', date_in)
ORDER BY month
```
The repository fills missing months with zero revenue to guarantee 12 bars.

### Date offset helper

Previous period computed in the store:
- If range spans N days → previous = `[start - N days, start - 1 day]`
- Month boundaries respected via `Date` arithmetic

## Testing Strategy

| Layer | What | Approach |
|-------|------|----------|
| Unit | `dashboardRepository.getKPIs` aggregation correctness | In-memory SQLite with seeded WOs/quotes, verify profit/revenue/pending/conversion |
| Unit | `dashboardRepository.getRevenueTrend` zero-fill | Seed sparse data across 14 months, assert 12 bars with zeros |
| Unit | MoM with empty prior period | Seed only current period, assert `previous: null` |
| Unit | Conversion rate with no quotes | Assert `rate: null` |
| E2E | Dashboard renders as landing page | Navigate to `/`, assert redirect to `/dashboard` and KPI cards visible |

## Migration / Rollout

No migration required. No schema changes — `customer_total`, `workshop_total`, `payment_status`, `date_in` already exist post-`002_dual_pricing`.

**Rollback**: Remove dashboard route and menu entry, revert redirect to `/customers`. All new files are self-contained; no existing files are destructively modified.

## Open Questions

None.
