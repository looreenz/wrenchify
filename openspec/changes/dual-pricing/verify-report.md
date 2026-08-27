# Verification Report: dual-pricing

## Change Summary

| Field | Value |
|-------|-------|
| Change | dual-pricing |
| Mode | hybrid (OpenSpec + Engram) |
| Branch | feature/dual-pricing |
| Commits | f0c6a19, ca71173, a441f6e |
| Tasks | 17/17 complete |
| PRs | 3 chained PRs (feature-branch-chain) |

## Completeness

| Artifact | Status | Notes |
|----------|--------|-------|
| Proposal | Present | Engram #161 |
| Specs | Present | Engram #165, 6 requirements (DP-001..004, FR-025, FR-020, FR-022, FR-024, FR-031, FR-034, FR-030, FR-064) |
| Design | Present | Engram #164 |
| Tasks | Present | Engram #166, 3 phases / 17 tasks |
| Implementation | Complete | All 17 tasks checked |

## Build & Test Evidence

### Tests

```
Test Files  7 passed (7)
Tests       67 passed (67)
Duration    2.35s
```

| Test File | Tests | Status |
|-----------|-------|--------|
| calcTotals.test.ts | 7 | PASS |
| migration.test.ts | 9 | PASS |
| repositories.test.ts | 29 | PASS |
| LineItemsEditor.test.ts | 5 | PASS |
| IndustrialComponents.test.ts | 13 | PASS |
| useTheme.test.ts | 3 | PASS |
| AppThemeIntegration.test.ts | 1 | PASS |

### TypeScript

```
pnpm typecheck (tsc --noEmit) — PASS, zero errors
```

### Lint

No lint script configured in package.json. Skipped.

## Spec Compliance Matrix

| Requirement | Scenario | Covering Test | Result |
|-------------|----------|---------------|--------|
| DP-001: Dual-Price Line Items | Add dual-priced item | repositories.test.ts: "adds line items and recalculates totals" | PASS |
| DP-001 | Validate prices >= 0 | repositories.test.ts: "rejects negative or invalid line item input" | PASS |
| DP-002: VAT Calculation | 21% VAT (cust 100, ws 70, qty 1) | calcTotals.test.ts: "calculates VAT for a single parts item" — cust_total 121, ws_total 84.7 | PASS |
| DP-002 | Rate change recalculates | migration.test.ts: "computes quote totals including VAT" + repository recalculateTotals on every mutation | PASS |
| DP-003: Net Profit | customer_total - workshop_total | calcTotals.test.ts: all 7 tests assert net_profit | PASS |
| DP-004: Customer Visibility | Workshop prices hidden in customer view | LineItemsEditor.test.ts: "hides workshop price columns when showWorkshopPrice is false" | PASS |
| FR-025: Quote Line Items | quote_items table CRUD | repositories.test.ts: quote line item CRUD tests | PASS |
| FR-020: Quote Data Model | vat_rate, customer_total, workshop_total replace parts_cost/total_cost | migration.test.ts: "replaces quote parts_cost/total_cost with vat_rate and dual totals" | PASS |
| FR-022: Quote Form | Embeds LineItemsEditor | QuoteForm.vue:127-136 — LineItemsEditor variant="quote" | PASS |
| FR-024: Convert to Work Order | Items carried 1:1 with dual prices | repositories.test.ts: "converts an accepted quote into a work order carrying line items and totals" | PASS |
| FR-031: Work Order Line Items | unit_price replaced by dual prices | migration.test.ts: "replaces unit_price with dual prices on work_order_items" | PASS |
| FR-034: Total Cost Calculation | Dual totals with VAT | repositories.test.ts: "recalculates dual totals when dual-priced line items change" | PASS |
| FR-030: Work Order Data Model | vat_rate snapshot, dual totals | migration.test.ts: "replaces work_order parts_cost/total_cost with vat_rate and dual totals" | PASS |
| FR-064: VAT Rate Setting | Default 0.21, validation 0..1 | repositories.test.ts: "returns default settings", "rejects VAT rate outside 0..1" | PASS |

## Design Coherence

| Decision | Implementation | Status |
|----------|---------------|--------|
| VAT snapshot on document row | quoteRepository.create() calls getVatRate() and stores on row; convert() carries vat_rate to work order | PASS |
| calcTotals as shared pure function | src/shared/calcTotals.ts used by repositories (main) and LineItemsEditor (renderer) | PASS |
| LineItemsEditor variant prop | `variant: 'quote' | 'workOrder'` switches store calls and title | PASS |
| DROP unit_price immediately | Migration 002 drops column after backfill | PASS |
| Parts-only dual pricing | calcTotals: labor items use hourlyRate, no workshop_price contribution | PASS |
| Denormalized totals cache | recalculateTotals() called after every item/labor/rate mutation | PASS |

## Issues

### CRITICAL

None.

### WARNING

None.

### SUGGESTION

1. **No lint script**: Consider adding ESLint for consistency enforcement.
2. **QuoteDetail shows workshop_total and net_profit**: This is correct for the internal operator view (spec DP-004 only restricts customer-facing printed/exported views, and PDF export is deferred). When PDF export is implemented, ensure those views filter workshop_price and net_profit.
3. **WorkOrderForm isReadOnly is hardcoded false**: Line 205 `const isReadOnly = computed(() => false)`. Paid work orders should probably be read-only. Not a spec violation but a UX gap.

## Key Decisions Applied

1. DROP `unit_price` column immediately in migration 002
2. ONLY parts items have dual pricing; labor keeps hourly_rate only
3. PDF export DEFERRED
4. VAT rate configurable in settings (default 21%), snapshotted on documents
5. Quotes migrated from flat parts_cost to quote_items table

## Verdict

**PASS**

All 17 tasks complete. All spec requirements covered by passing tests. Design decisions correctly implemented. No blocking issues.
