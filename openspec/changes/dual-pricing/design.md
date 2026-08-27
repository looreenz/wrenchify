# Design: Dual Pricing & VAT for Spare Parts

## Technical Approach

Add dual pricing (customer_price / workshop_price) per line item, configurable VAT, and profit visibility to both quotes and work orders. This requires: (1) a new `quote_items` table, (2) dual-price columns on both item tables, (3) VAT-aware calculation engine in the repository layer, and (4) refactoring `LineItemsEditor.vue` into a generic component parameterized by document type.

## Architecture Decisions

### Decision: VAT Rate Snapshot on Documents

**Choice**: Store `vat_rate` on each quote/work_order row at creation time.
**Alternatives considered**: (A) Always use current global rate, (B) Snapshot on individual items.
**Rationale**: (A) would retroactively change historical totals — unacceptable for invoicing. (B) adds per-row complexity with no real use case. Document-level snapshot balances accuracy and simplicity.

### Decision: Replace `parts_cost` with Computed Totals

**Choice**: Deprecate `parts_cost` column. Store `customer_total` and `workshop_total` as denormalized cached columns computed from items.
**Alternatives considered**: Keep `parts_cost` as manual override field.
**Rationale**: Dual pricing requires item-level granularity. Keeping a flat field alongside items creates two sources of truth. The denormalized totals are recomputed on every item mutation (existing pattern: `recalculateTotalCost`).

### Decision: Generic LineItemsEditor via Props

**Choice**: Refactor `LineItemsEditor.vue` to accept a `variant` prop (`'quote' | 'workOrder'`) and `documentId`. Inject the appropriate store/repository via a composable.
**Alternatives considered**: Duplicate the component for quotes.
**Rationale**: 90% of the template is identical. A prop-driven variant avoids code duplication and keeps validation/editing logic in one place.

### Decision: Calculation Engine Location

**Choice**: All monetary calculations happen in the repository layer (main process). UI computes display-only previews via a shared `calcTotals` composable.
**Alternatives considered**: Calculate in stores only, or in SQLite triggers.
**Rationale**: Repository is the source of truth — it already recalculates `total_cost` on mutations. A shared composable avoids duplicating formula logic between main and renderer.

## Data Flow

```
User edits line item
       │
       ▼
LineItemsEditor.vue  ──→  quoteStore / workOrderStore  ──→  IPC
       │                                                        │
       ▼                                                        ▼
  composable:calcTotals()                              Repository (main)
  (preview: customer_total,                            ┌──────────────────┐
   workshop_total, profit)                             │ INSERT/UPDATE item│
       │                                               │ recalcTotals()   │
       │                                               │ snapshot vat_rate│
       │                                               └──────────────────┘
       │                                                        │
       ▼                                                        ▼
  UI re-renders                                        DB persists totals
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/db/migrations/002_dual_pricing.sql` | Create | New `quote_items` table; alter `work_order_items` (add `customer_price`, `workshop_price`); alter `quotes`/`work_orders` (add `vat_rate`, `customer_total`, `workshop_total`); seed `vat_rate` setting |
| `src/shared/types.ts` | Modify | Add `QuoteItem`, `QuoteItemCreate`, `QuoteItemUpdate` interfaces. Add `customer_price`, `workshop_price` to `WorkOrderItem`. Add `vat_rate` to `SettingsMap`. Add `customer_total`, `workshop_total`, `vat_rate` to `Quote`/`WorkOrder` |
| `src/db/repositories/quoteRepository.ts` | Modify | Add `getLineItems`, `addLineItem`, `updateLineItem`, `deleteLineItem`. Replace `calculateQuoteTotal` with VAT-aware version. Remove `parts_cost` from create/update. Carry items in `convert()` |
| `src/db/repositories/workOrderRepository.ts` | Modify | Replace `calculateWorkOrderTotal` with VAT-aware dual-total calc. Add `customer_price`/`workshop_price` to item CRUD. Store `vat_rate` snapshot on create |
| `src/db/repositories/settingsRepository.ts` | Modify | Add `vat_rate` to `DEFAULT_SETTINGS` (0.21). Add `getVatRate()` helper. Add validation in `update()` |
| `src/shared/calcTotals.ts` | Create | Shared pure function: `calcTotals(items, vatRate, laborHours, hourlyRate)` returning `{ customerSubtotal, workshopSubtotal, customerVat, workshopVat, customerTotal, workshopTotal, netProfit }` |
| `src/renderer/stores/quotes.ts` | Modify | Add `getLineItems`, `addLineItem`, `updateLineItem`, `deleteLineItem` methods |
| `src/renderer/components/LineItemsEditor.vue` | Modify | Accept `variant` prop. Add `customer_price`/`workshop_price` columns. Show per-row profit. Emit dual totals |
| `src/renderer/views/quotes/QuoteForm.vue` | Modify | Replace `parts_cost` field with `LineItemsEditor` (variant='quote'). Show profit summary |
| `src/renderer/views/work-orders/WorkOrderForm.vue` | Modify | Update totals display: customer total, workshop total, net profit |
| `src/renderer/views/quotes/QuoteDetail.vue` | Modify | Show line items table with customer prices only. Hide workshop prices |
| `src/main/ipc/handlers.ts` | Modify | Register new `quotes:getLineItems`, `quotes:addLineItem`, `quotes:updateLineItem`, `quotes:deleteLineItem` handlers |
| `src/preload/index.ts` | Modify | Expose new quote line item IPC methods in `WrenchifyAPI` |
| `src/i18n/it.json` | Modify | Add keys: `lineItem.customerPrice`, `lineItem.workshopPrice`, `quote.customerTotal`, `quote.workshopTotal`, `quote.netProfit`, `settings.vatRate` |
| `src/i18n/es.json` | Modify | Same keys as Italian |

## Interfaces / Contracts

```typescript
// New types in src/shared/types.ts

export interface QuoteItem {
  id: number
  quote_id: number
  description: string
  quantity: number
  customer_price: number   // without VAT
  workshop_price: number   // without VAT
  item_type: WorkOrderItemType
  created_at: string
  updated_at: string
}

export interface QuoteItemCreate {
  description: string
  quantity?: number
  customer_price?: number
  workshop_price?: number
  item_type?: WorkOrderItemType
}

// Extended WorkOrderItem (add to existing interface)
// + customer_price: number  (replaces unit_price)
// + workshop_price: number

// Extended Quote and WorkOrder (add to existing interfaces)
// + vat_rate: number
// + customer_total: number
// + workshop_total: number
// (remove parts_cost, total_cost → replaced by customer_total)

// SettingsMap extension
// + vat_rate: number  (decimal, e.g. 0.21)

// calcTotals return shape
export interface DocumentTotals {
  customerSubtotal: number   // SUM(customer_price * qty)
  workshopSubtotal: number   // SUM(workshop_price * qty)
  laborSubtotal: number      // labor_hours * hourly_rate
  customerVat: number        // (customerSubtotal + laborSubtotal) * vat_rate
  workshopVat: number        // (workshopSubtotal + laborSubtotal) * vat_rate
  customerTotal: number      // customerSubtotal + laborSubtotal + customerVat
  workshopTotal: number      // workshopSubtotal + laborSubtotal + workshopVat
  netProfit: number           // customerTotal - workshopTotal
}
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `calcTotals()` pure function | Vitest: various item combos, zero qty, zero prices, VAT edge cases (0%, 100%) |
| Unit | Repository migration correctness | Vitest: run migration on in-memory SQLite, verify schema + seed data |
| Unit | Repository CRUD with dual prices | Vitest: create/update/delete items, verify totals recalculated |
| Unit | Quote-to-WorkOrder conversion carries items | Vitest: convert accepted quote, verify all items + dual prices in WO |
| Integration | IPC round-trip for new endpoints | Vitest + real SQLite: test full create → add items → get totals flow |

## Migration / Rollout

### Migration `002_dual_pricing.sql`

```sql
-- 1. Add vat_rate setting
INSERT OR IGNORE INTO settings (key, value) VALUES ('vat_rate', '0.21');

-- 2. Create quote_items table
CREATE TABLE quote_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  customer_price REAL NOT NULL DEFAULT 0,
  workshop_price REAL NOT NULL DEFAULT 0,
  item_type TEXT NOT NULL DEFAULT 'parts',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);
CREATE INDEX idx_quote_items_quote_id ON quote_items(quote_id);

-- 3. Alter work_order_items: add dual prices, migrate unit_price → customer_price
ALTER TABLE work_order_items ADD COLUMN customer_price REAL NOT NULL DEFAULT 0;
ALTER TABLE work_order_items ADD COLUMN workshop_price REAL NOT NULL DEFAULT 0;
UPDATE work_order_items SET customer_price = unit_price;

-- 4. Add vat_rate + dual totals to quotes
ALTER TABLE quotes ADD COLUMN vat_rate REAL NOT NULL DEFAULT 0.21;
ALTER TABLE quotes ADD COLUMN customer_total REAL NOT NULL DEFAULT 0;
ALTER TABLE quotes ADD COLUMN workshop_total REAL NOT NULL DEFAULT 0;

-- 5. Migrate existing quotes: create single quote_item from parts_cost
INSERT INTO quote_items (quote_id, description, quantity, customer_price, workshop_price, item_type)
SELECT id, 'Parts (migrated)', 1, parts_cost, 0, 'parts'
FROM quotes WHERE parts_cost > 0;

-- 6. Backfill quote totals
UPDATE quotes SET customer_total = labor_hours * hourly_rate + parts_cost;

-- 7. Add vat_rate + dual totals to work_orders
ALTER TABLE work_orders ADD COLUMN vat_rate REAL NOT NULL DEFAULT 0.21;
ALTER TABLE work_orders ADD COLUMN customer_total REAL NOT NULL DEFAULT 0;
ALTER TABLE work_orders ADD COLUMN workshop_total REAL NOT NULL DEFAULT 0;

-- 8. Backfill work order totals
UPDATE work_orders SET
  customer_total = labor_hours * hourly_rate + parts_cost
    + COALESCE((SELECT SUM(quantity * customer_price) FROM work_order_items WHERE work_order_id = work_orders.id), 0);
```

### Rollout
No feature flag needed — single-user app, migration runs on startup. Existing data preserved via backfill queries.

## Open Questions

- [ ] Should `unit_price` column on `work_order_items` be dropped in this migration or kept for a release cycle?
- [ ] Should labor items (item_type='labor') also support dual pricing, or only parts items?
- [ ] Customer-facing PDF export: confirm it shows only customer_price + VAT (no internal prices)
