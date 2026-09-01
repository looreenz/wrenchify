# Tasks: Dashboard with Charts & KPIs

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~680 (3 new files ~360 lines, 7 modified ~215 lines, 2 test files ~160 lines, deps ~2 lines, minus ~5 deletions) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Backend/Foundation) → PR 2 (Frontend/UI) |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Backend pipeline: types, repository, IPC, preload, deps, unit tests | PR 1 | Self-contained; all data layer + tests pass independently |
| 2 | Frontend UI: store, view, router, layout, i18n, E2E test | PR 2 | Depends on PR 1; completes user-facing dashboard |

## Phase 1: Foundation — Types & Dependencies

- [x] 1.1 Install `chart.js` and `vue-chartjs` via `pnpm add chart.js vue-chartjs` — verify `package.json` updated
- [x] 1.2 Add `DateRange`, `KPIValue`, `DashboardKPIs`, `RevenueTrendPoint` interfaces to `src/shared/types.ts` — export all four
- [x] 1.3 Add `dashboard` namespace to `WrenchifyAPI` interface in `src/shared/types.ts` — `getKPIs(DateRange) => Promise<DashboardKPIs>`, `getRevenueTrend(string) => Promise<RevenueTrendPoint[]>`

## Phase 2: Data Layer — Repository

- [x] 2.1 Create `src/db/repositories/dashboardRepository.ts` — export `getKPIs(start, end)` with 4 SQL queries: profit/revenue current+prev period, pending WOs snapshot, conversion rate current+prev period
- [x] 2.2 Add `getRevenueTrend(endDate)` to `dashboardRepository.ts` — GROUP BY `strftime('%Y-%m', date_in)` for 12 months, zero-fill missing months
- [x] 2.3 Write unit tests in `tests/unit/dashboardRepository.test.ts` — test profit/revenue aggregation, pending count snapshot, conversion rate, zero-fill trend, null previous period, null conversion with no quotes (4+ test cases using in-memory SQLite)

## Phase 3: IPC Wiring

- [x] 3.1 Add `import * as dashboardRepository` to `src/main/ipc/handlers.ts` — register `dashboard:getKPIs` and `dashboard:getRevenueTrend` handlers
- [x] 3.2 Add `dashboard` namespace to `src/preload/index.ts` — expose `getKPIs` and `getRevenueTrend` via `ipcRenderer.invoke`

## Phase 4: Frontend — Store & View

- [ ] 4.1 Create `src/renderer/stores/dashboard.ts` — Pinia store with `kpis`, `trend`, `loading`, `dateRange` state; `fetchKPIs()` and `fetchRevenueTrend()` actions; previous-period date offset computation
- [ ] 4.2 Create `src/renderer/views/dashboard/DashboardView.vue` — 4 KPI cards (profit, revenue, pending WOs, conversion rate) with MoM delta, date range picker (presets + custom), revenue trend bar chart via vue-chartjs with tree-shaken registration, empty state component
- [ ] 4.3 Add i18n keys `dashboard.*` to `src/i18n/it.json` — KPI labels, chart title, date presets, empty state, N/A indicator
- [ ] 4.4 Add i18n keys `dashboard.*` to `src/i18n/es.json` — matching Spanish translations

## Phase 5: Routing & Navigation

- [ ] 5.1 Add `/dashboard` route to `src/renderer/router.ts` — lazy-import `DashboardView.vue`, change default redirect from `/customers` to `/dashboard`
- [ ] 5.2 Update `src/renderer/layouts/MainLayout.vue` — import `LayoutDashboard` from lucide, add Dashboard as first item in `mainMenuOptions`, add `dashboard` to `activeKey` map

## Phase 6: E2E Verification

- [ ] 6.1 Write E2E test in `tests/e2e/dashboard.spec.ts` — verify `/` redirects to `/dashboard`, KPI cards render, date filter changes data, empty state shows with no data
