# Proposal: Dashboard with Charts & KPIs

## Intent

No business overview exists. The owner manually inspects work orders, quotes, and payments to assess performance. A dashboard consolidates profit, revenue, and pending work into one snapshot — enabling strategic review and operational triage.

## Scope

### In Scope
- KPI cards: monthly revenue, profit, pending work orders, pending payments
- Month-over-month comparison with delta %
- Revenue/profit trend chart (daily granularity)
- Date range filter: current month, previous month, current year, custom
- Dashboard as landing page (`/` → `/dashboard`) + sidebar entry
- Full IT/ES i18n

### Out of Scope
- PDF/CSV export, real-time updates, per-user customization, KPI drill-down

## Capabilities

### New Capabilities
- `dashboard`: KPI aggregation, chart rendering, date range filtering, landing page routing

### Modified Capabilities
- None (navigation changes are implementation concerns, not spec-level)

## Approach

Follow repository → IPC → Pinia store → view pattern. New `dashboardRepository.ts` with SQL aggregation queries (profit = `SUM(customer_total) - SUM(workshop_total)`). Two IPC methods, Pinia store, `DashboardView.vue` with vue-chartjs. Router redirect changes to `/dashboard`; MainLayout adds dashboard as first menu item.

Chart library: `chart.js` + `vue-chartjs` (~60KB, acceptable for desktop).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/db/repositories/dashboardRepository.ts` | New | Aggregation queries |
| `src/main/ipc/handlers.ts` | Modified | +2 IPC handlers |
| `src/preload/index.ts` | Modified | Expose new methods |
| `src/shared/types.ts` | Modified | Dashboard interfaces + API types |
| `src/renderer/router.ts` | Modified | New route + redirect |
| `src/renderer/layouts/MainLayout.vue` | Modified | Menu entry |
| `src/renderer/views/dashboard/DashboardView.vue` | New | Dashboard view |
| `src/renderer/stores/dashboard.ts` | New | Pinia store |
| `src/i18n/{it,es}.json` | Modified | Translation keys |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| No prior month for comparison | Med | Show "N/A" when previous period empty |
| Dual-pricing not yet merged | Med | Profit KPI needs `customer_total`/`workshop_total`; coordinate merge |
| Bundle size increase | Low | ~60KB negligible for Electron desktop |

## Rollback Plan

Remove dashboard route/menu, revert redirect to `/customers`. All files self-contained, no schema changes.

## Dependencies

- **dual-pricing change**: Profit KPI requires `customer_total`/`workshop_total` columns
- **chart.js + vue-chartjs**: `pnpm add chart.js vue-chartjs`

## Success Criteria

- [ ] Dashboard loads as landing page on app start
- [ ] KPI cards show correct revenue, profit, pending WOs, pending payments
- [ ] Month-over-month delta correct (including empty prior period)
- [ ] Chart renders daily granularity for selected period
- [ ] Date range filter works for all presets + custom
- [ ] Full IT/ES translation
- [ ] No regression in existing navigation
