# Proposal: Dual Pricing & VAT for Spare Parts

## Intent

The workshop needs to track what customers pay vs what the workshop pays suppliers for each spare part, with configurable VAT applied on top. Currently quotes have no line items (flat `parts_cost`), work orders have line items but only a single price, and there is no VAT logic. This change adds dual pricing (customer price / workshop cost) and VAT calculation to both quotes and work orders, enabling profit visibility per job.

## Scope

### In Scope
- Migrate quotes from flat `parts_cost` to line items (`quote_items` table)
- Add `customer_price` and `workshop_price` to both `quote_items` and `work_order_items`
- Configurable VAT rate in settings (default 21%)
- Auto-calculate: customer total, workshop total, net profit per document
- UI: LineItemsEditor for quotes (reuse pattern from work orders)
- Customer-facing views show only customer price + VAT

### Out of Scope
- Multi-currency support
- VAT per-item overrides (single rate applies globally)
- Supplier/vendor management
- Purchase order generation
- Historical VAT rate tracking (snapshot per transaction — deferred to design phase)

## Capabilities

### New Capabilities
- `dual-pricing`: Per-item customer/workshop prices, VAT calculation, profit visibility

### Modified Capabilities
- `quoting`: Flat `parts_cost` replaced by line items with dual pricing
- `work-order-management`: Line items gain `workshop_price`; totals recalculate with VAT
- `app-settings`: New `vat_rate` setting (default 21%)

## Approach

1. **Schema migration**: Create `quote_items` table mirroring `work_order_items` structure. Add `customer_price`/`workshop_price` columns to both item tables, replacing `unit_price`. Add `vat_rate` to settings seed.
2. **Calculation engine**: Per-item: `customer_total = customer_price * qty * (1 + vat_rate)`, `workshop_total = workshop_price * qty * (1 + vat_rate)`. Document-level: `net_profit = SUM(customer_total) - SUM(workshop_total)`.
3. **UI**: Extend `LineItemsEditor.vue` to accept dual price columns. Parameterize or create a variant for quotes. Add profit summary row.
4. **Quote conversion**: Carry over `quote_items` to `work_order_items` with same dual prices.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/db/schema` | Modified | New `quote_items` table; alter `work_order_items`; add `vat_rate` to settings seed |
| `src/stores/quotes` | Modified | Line item CRUD; new total calculations |
| `src/stores/workOrders` | Modified | Dual price fields; VAT-aware totals |
| `src/stores/settings` | Modified | `vat_rate` key with reactive default |
| `src/components/LineItemsEditor.vue` | Modified | Dual price columns, profit display |
| `src/views/QuoteForm.vue` | Modified | Embed line items editor (replace flat parts_cost) |
| `src/views/WorkOrderForm.vue` | Modified | Updated total display with VAT breakdown |
| `src/i18n/{it,es}.json` | Modified | New translation keys for dual pricing UI |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Existing `work_order_items.unit_price` must map to new dual-price columns | Medium | Migration: `unit_price` -> `customer_price`, `workshop_price` = 0 (user fills later) |
| Existing quotes with flat `parts_cost` lose granularity | Medium | Migration: single `quote_item` per quote, `parts_cost` as `customer_price`, `workshop_price` = 0 |
| VAT rate changes retroactively affect old records | Low | Design phase: snapshot VAT at creation vs current rate. Recommend snapshot. |
| Quote-to-order conversion breaks with new item structure | Low | Carry over `quote_items` 1:1 to `work_order_items` |

## Rollback Plan

1. Keep migration scripts reversible (retain `unit_price` column until verified)
2. Feature flag dual pricing behind a settings toggle during rollout
3. If rollback needed: revert to single `unit_price`, recalculate totals without VAT

## Dependencies

- `i18n`: new translation keys for both languages
- `theme-system`: profit display styling tokens

## Success Criteria

- [ ] Quotes support line items with dual pricing (customer_price, workshop_price)
- [ ] Work orders display dual pricing per line item
- [ ] VAT rate configurable in settings, defaults to 21%
- [ ] Customer total, workshop total, and net profit auto-calculated correctly
- [ ] Customer-facing views show only customer price + VAT (no workshop price leakage)
- [ ] Existing data migrated without loss
- [ ] Quote-to-work-order conversion preserves dual pricing
