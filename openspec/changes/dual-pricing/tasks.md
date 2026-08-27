# Tasks: Dual Pricing & VAT

## Review Workload Forecast

Estimated changed lines: ~850
Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

### Work Units

| Unit | PR | Lines | Scope |
|------|----|-------|-------|
| 1 | PR 1 | ~260 | Schema + types + calcTotals |
| 2 | PR 2 | ~330 | Repos + IPC + stores |
| 3 | PR 3 | ~260 | UI + views + i18n |

## Phase 1: Foundation

- [x] 1.1 Create `src/db/migrations/002_dual_pricing.sql` — `quote_items` table; dual-price cols on `work_order_items`, backfill + DROP `unit_price`; `vat_rate`/`customer_total`/`workshop_total` on quotes+work_orders; DROP `parts_cost`/`total_cost`; seed `vat_rate` (77 lines)
- [x] 1.2 Update `src/shared/types.ts` — add `QuoteItem`/Create/Update; add `customer_price`+`workshop_price` to `WorkOrderItem`; add `vat_rate`/`customer_total`/`workshop_total` to Quote/WorkOrder; `DocumentTotals`; `vat_rate` setting; extend `WrenchifyAPI.quotes` (legacy fields kept transitional for Phase 1 compile)
- [x] 1.3 Create `src/shared/calcTotals.ts` — pure function `(items, laborHours, hourlyRate, vatRate)→DocumentTotals`; parts-only dual pricing; labor via `laborSubtotal` (57 lines)
- [x] 1.4 Create `tests/unit/calcTotals.test.ts` — 21%/0% VAT, zero qty/price, mixed parts+labor, document labor (115 lines)
- [x] 1.5 Create `tests/unit/migration.test.ts` — verify schema, column drops, backfill, totals computation, seed (134 lines)

## Phase 2: Backend

- [x] 2.1 Update `settingsRepository.ts` — `vat_rate: 0.21` default, `getVatRate()`, validation 0..1 (~15 lines)
- [x] 2.2 Update `quoteRepository.ts` — line item CRUD; VAT-aware dual totals via `calcTotals`; remove `parts_cost`; snapshot `vat_rate`; carry items in `convert()` (~100 lines)
- [x] 2.3 Update `workOrderRepository.ts` — replace `unit_price`→dual prices; dual-total recalc; remove `parts_cost`; snapshot `vat_rate`; `recalculateTotals` writes both totals (~80 lines)
- [x] 2.4 Update `ipc/handlers.ts` — 4 quote line item handlers (~20 lines)
- [x] 2.5 Update `preload/index.ts` — expose 4 quote line item methods (~8 lines)
- [x] 2.6 Update `stores/quotes.ts` — add line item methods (~25 lines)
- [x] 2.7 Update `stores/settings.ts` — add `vatRate` computed (~3 lines)
- [x] 2.8 Update `tests/unit/repositories.test.ts` — line item CRUD, conversion carries items, vat snapshot, validation (~80 lines)

## Phase 3: Frontend

- [ ] 3.1 Refactor `LineItemsEditor.vue` — `variant` prop; dual price cols; hide `workshop_price` for labor; per-row profit; `calcTotals` summary; emit `DocumentTotals` (~100 lines)
- [ ] 3.2 Update `QuoteForm.vue` — remove `parts_cost`; embed `LineItemsEditor variant="quote"`; show customer_total/workshop_total/net_profit (~60 lines)
- [ ] 3.3 Update `WorkOrderForm.vue` — remove `parts_cost`; dual totals + profit display (~40 lines)
- [ ] 3.4 Update `QuoteDetail.vue` — line items table (customer prices only); hide workshop prices (~35 lines)
- [ ] 3.5 Update `SettingsView.vue` — add `vat_rate` input (0..1, step 0.01) (~15 lines)
- [ ] 3.6 Update `it.json` + `es.json` — `lineItem.customerPrice/workshopPrice/profit`, `quote.customerTotal/workshopTotal/netProfit`, `settings.vatRate` (~20 lines)
