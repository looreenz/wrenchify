# Tasks: Wrenchify MVP

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~4,400 (34 tasks across 5 batches) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 → PR 5 |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending (user decision required) |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Lines | Notes |
|------|------|-----------|-------|-------|
| 1 | Foundation: scaffolding, types, DB, i18n setup | PR 1 | ~470 | App boots, DB initializes, i18n loads |
| 2 | Data layer: 6 repositories, IPC handlers, preload bridge | PR 2 | ~900 | All CRUD testable via repos; IPC wired |
| 3 | UI shell + Customer/Vehicle features | PR 3 | ~1,490 | Navigation, stores, full customer+vehicle CRUD, timeline |
| 4 | Business features: quotes, work orders, payments | PR 4 | ~930 | Quote lifecycle, WO+line items, payment tracking |
| 5 | Settings, backup, testing infrastructure | PR 5 | ~610 | Settings view, auto/manual backup, Vitest+Playwright |

## Phase 1: Foundation (Batch 1 — PR 1)

- [ ] **T001** Project scaffolding | `package.json`, `vite.config.ts`, `tsconfig.json`, `electron-builder.yml`, `src/main/index.ts` | ~170 lines | Deps: none | Priority: high
  - Electron + Vue 3 + Vite + TypeScript config. Dev + build scripts. Basic main process window creation.
- [ ] **T002** Shared TypeScript types | `src/shared/types.ts` | ~120 lines | Deps: T001 | Priority: high
  - All interfaces: Customer, Vehicle, Quote, WorkOrder, WorkOrderItem, Payment, Settings, plus Create/Update variants and filter types.
- [ ] **T003** Database connection + migration runner | `src/db/connection.ts` | ~60 lines | Deps: T001 | Priority: high
  - better-sqlite3 init, WAL mode, `runMigrations()` that reads `migrations/*.sql` in order.
- [ ] **T004** Initial schema migration | `src/db/migrations/001_initial.sql` | ~80 lines | Deps: T003 | Priority: high
  - 7 tables (customers, vehicles, quotes, work_orders, work_order_items, payments, settings), indexes, seed defaults.
- [ ] **T005** i18n setup | `src/i18n/index.ts`, `src/i18n/it.json`, `src/i18n/es.json` | ~40 lines | Deps: T001 | Priority: high
  - vue-i18n Composition API init, locale loader, skeleton dictionaries with app-level keys only.

**Batch 1 total: ~470 lines**

## Phase 2: Data Layer (Batch 2 — PR 2)

- [ ] **T006** Customer repository | `src/db/repositories/customerRepository.ts` | ~100 lines | Deps: T002, T003, T004 | Priority: high
  - list (search), getById, create, update, delete (cascade check).
- [ ] **T007** Vehicle repository | `src/db/repositories/vehicleRepository.ts` | ~110 lines | Deps: T002–T004 | Priority: high
  - CRUD + getTimeline (chronological work orders for a vehicle). License plate uppercase. Restrict delete if WOs exist.
- [ ] **T008** Quote repository | `src/db/repositories/quoteRepository.ts` | ~130 lines | Deps: T002–T004 | Priority: high
  - CRUD + auto-number (Q-YYYYMMDD-NNN) + convert() creates work order, sets status=converted. total_cost calc.
- [ ] **T009** Work order repository | `src/db/repositories/workOrderRepository.ts` | ~160 lines | Deps: T002–T004 | Priority: high
  - CRUD + auto-number (WO-YYYYMMDD-NNN) + line item CRUD + total_cost calc + payment_status recalc. Mileage validation.
- [ ] **T010** Payment repository | `src/db/repositories/paymentRepository.ts` | ~80 lines | Deps: T002–T004 | Priority: high
  - listByWorkOrder, create, update, delete. Triggers WO payment_status recalc. Lock edits when WO paid.
- [ ] **T011** Settings repository | `src/db/repositories/settingsRepository.ts` | ~40 lines | Deps: T002–T004 | Priority: medium
  - getAll (key→value map), update(key, value).
- [ ] **T012** IPC handlers | `src/main/ipc/handlers.ts` | ~200 lines | Deps: T006–T011 | Priority: high
  - Register ipcMain.handle for all repo methods. Wire to `registerAllHandlers(db)`.
- [ ] **T013** Preload bridge | `src/preload/index.ts` | ~80 lines | Deps: T002, T012 | Priority: high
  - contextBridge exposes `window.wrenchify` matching WrenchifyAPI interface.

**Batch 2 total: ~900 lines**

## Phase 3: UI Shell + Customer/Vehicle (Batch 3 — PR 3)

- [ ] **T014** Vue app entry + router | `src/renderer/index.ts`, `src/renderer/router.ts` | ~90 lines | Deps: T001, T005 | Priority: high
  - Vue 3 + Pinia + vue-i18n + Naive UI setup. Vue Router with all routes (customers, vehicles, quotes, work-orders, settings).
- [ ] **T015** MainLayout | `src/renderer/layouts/MainLayout.vue` | ~80 lines | Deps: T014 | Priority: high
  - Sidebar nav (Naive UI Menu) with Lucide icons. Router-view content area. Responsive.
- [ ] **T016** Pinia stores (6 domains) | `src/renderer/stores/{customers,vehicles,quotes,workOrders,payments,settings}.ts` | ~290 lines | Deps: T002, T013 | Priority: high
  - One store per domain. Each: state (items[], loading), actions (fetch, create, update, remove). Calls `window.wrenchify.*`.
- [ ] **T017** Full i18n dictionaries | `src/i18n/it.json`, `src/i18n/es.json` | ~400 lines | Deps: T005 | Priority: high
  - All UI strings: nav, forms, lists, buttons, validations, statuses, settings, backup. Identical key structure.
- [ ] **T018** Customer list view | `src/renderer/views/customers/CustomerList.vue` | ~120 lines | Deps: T015, T016, T017 | Priority: high
  - Naive UI DataTable, search input, empty state, link to create/edit/detail.
- [ ] **T019** Customer form view | `src/renderer/views/customers/CustomerForm.vue` | ~150 lines | Deps: T015, T016, T017 | Priority: high
  - Create/edit form with validation (required fields, email format). Naive UI Form component.
- [ ] **T020** Vehicle list view | `src/renderer/views/vehicles/VehicleList.vue` | ~100 lines | Deps: T015, T016, T017 | Priority: high
  - Filtered by customer option. Shows license plate, make, model, year.
- [ ] **T021** Vehicle form view | `src/renderer/views/vehicles/VehicleForm.vue` | ~140 lines | Deps: T015, T016, T017 | Priority: high
  - Customer pre-selected (from route query). Year validation. License plate uppercase.
- [ ] **T022** Vehicle timeline view | `src/renderer/views/vehicles/VehicleTimeline.vue` | ~120 lines | Deps: T015, T016, T017 | Priority: medium
  - Chronological WO list. Date, mileage, cost, payment status. CSS mileage progression indicator.

**Batch 3 total: ~1,490 lines**

## Phase 4: Business Features (Batch 4 — PR 4)

- [ ] **T023** Quote list view | `src/renderer/views/quotes/QuoteList.vue` | ~110 lines | Deps: T015–T017 | Priority: high
  - DataTable with status badges (draft/accepted/rejected/converted). Filters.
- [ ] **T024** Quote form view | `src/renderer/views/quotes/QuoteForm.vue` | ~160 lines | Deps: T015–T017 | Priority: high
  - Vehicle/customer selection. hourly_rate pre-filled from settings (editable). Auto total_cost. Read-only if non-draft.
- [ ] **T025** Quote detail + conversion | `src/renderer/views/quotes/QuoteDetail.vue` | ~80 lines | Deps: T015–T017 | Priority: high
  - Display quote. Accept/reject buttons. Convert button (creates WO, redirects).
- [ ] **T026** Work order list view | `src/renderer/views/work-orders/WorkOrderList.vue` | ~120 lines | Deps: T015–T017 | Priority: high
  - Filters: date range, payment_status, customer. Payment status badges.
- [ ] **T027** Work order form view | `src/renderer/views/work-orders/WorkOrderForm.vue` | ~180 lines | Deps: T015–T017 | Priority: high
  - Full form: vehicle, dates, mileage (validation), labor, parts, hourly_rate. Line items editor integration.
- [ ] **T028** Line items editor component | `src/renderer/components/LineItemsEditor.vue` | ~150 lines | Deps: T015, T016 | Priority: high
  - Add/edit/delete line items (description, qty, unit_price, type). Running total. Reusable within WO form.
- [ ] **T029** Payment tracking section | `src/renderer/views/work-orders/PaymentSection.vue` | ~130 lines | Deps: T015–T017 | Priority: high
  - Payment list with running total + remaining balance. Add/edit/delete forms. Lock when WO paid.

**Batch 4 total: ~930 lines**

## Phase 5: Settings, Backup & Testing (Batch 5 — PR 5)

- [ ] **T030** Settings view | `src/renderer/views/settings/SettingsView.vue` | ~100 lines | Deps: T015–T017 | Priority: medium
  - Form: hourly_rate, default_language (select IT/ES), shop_name. Immediate effect via Pinia.
- [ ] **T031** Auto-backup on close | `src/main/backup.ts`, update `src/main/index.ts` | ~90 lines | Deps: T003 | Priority: medium
  - WAL checkpoint → copy SQLite to `{userData}/backups/` → FIFO rotation (keep last 3). Hook into app before-quit.
- [ ] **T032** Manual export/restore | update `src/main/backup.ts`, `src/main/ipc/handlers.ts` | ~70 lines | Deps: T031 | Priority: medium
  - Export: Save As dialog. Restore: file picker → confirm → validate SQLite → replace DB → reload.
- [ ] **T033** Vitest setup + repo unit tests | `vitest.config.ts`, `tests/unit/repositories.test.ts` | ~220 lines | Deps: T006–T011 | Priority: medium
  - In-memory SQLite. Test all repo CRUD, auto-numbers, total_cost calc, payment_status, quote conversion.
- [ ] **T034** Playwright setup + E2E smoke test | `playwright.config.ts`, `tests/e2e/smoke.spec.ts` | ~130 lines | Deps: T014–T029 | Priority: low
  - Config for Electron. Smoke test: create customer → vehicle → quote → convert → add payment.

**Batch 5 total: ~610 lines**

---

## Summary

| Metric | Value |
|--------|-------|
| Total tasks | 34 |
| Total estimated lines | ~4,400 |
| Batches (PRs) | 5 |
| Critical path | T001 → T003 → T004 → T009 → T012 → T013 → T016 → T017 → T027 → T028 → T029 → T033 |

### Dependency Graph (simplified)

```
T001 → T002, T003, T005
T002, T003, T004 → T006–T011
T006–T011 → T012 → T013
T013 → T016 → T014, T015
T014, T015, T016, T017 → T018–T029
T003 → T031 → T032
T006–T011 → T033
T014–T029 → T034
```

### Parallelism Opportunities

- T002, T003, T005 can run in parallel after T001
- T006–T011 can run in parallel after T002+T003+T004
- T018–T022 (customer/vehicle views) can run in parallel after T015+T016+T017
- T023–T025 (quote views) can run in parallel
- T026–T029 (WO views) can run in parallel (T028 before T027)
