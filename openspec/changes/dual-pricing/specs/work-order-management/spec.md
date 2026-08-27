# Delta for Work Order Management

## MODIFIED Requirements

### Requirement: Work Order Line Items (FR-031)

The system MUST store line items in a `work_order_items` table:

| Field | Type | Constraint |
|-------|------|-----------|
| id | INTEGER | PK, auto-increment |
| work_order_id | INTEGER | FK → work_orders.id, REQUIRED |
| description | TEXT | REQUIRED |
| quantity | REAL | REQUIRED, > 0 |
| customer_price | REAL | REQUIRED, ≥ 0 (replaces unit_price) |
| workshop_price | REAL | REQUIRED, ≥ 0 |
| item_type | TEXT | ENUM: parts, labor |

(Previously: single unit_price field)

#### Scenario: Add line item with dual pricing

- GIVEN work order WO-20260826-001 is open for editing
- WHEN the user adds "Brake pads", qty 2, customer_price 45.00, workshop_price 30.00
- THEN the item is saved and totals are recalculated

#### Scenario: Remove line item

- GIVEN a work order has 3 line items
- WHEN the user removes the second item
- THEN the item is deleted and totals are recalculated

### Requirement: Total Cost Auto-Calculation (FR-034)

The system MUST calculate two totals, recalculated on every save:

- `customer_total = (labor_hours × hourly_rate × (1 + vat_rate)) + SUM(item.customer_price × item.quantity × (1 + vat_rate))`
- `workshop_total = SUM(item.workshop_price × item.quantity × (1 + vat_rate))`
- `net_profit = customer_total - workshop_total`

(Previously: single total_cost = labor + parts_cost + SUM(qty × unit_price))

#### Scenario: Calculate totals with dual pricing and VAT

- GIVEN labor_hours=2, hourly_rate=50, vat_rate=0.21, 2 items: (pads: 2×45 cust, 2×30 ws) + (filter: 1×12 cust, 1×8 ws)
- WHEN the work order is saved
- THEN customer_total = (2×50×1.21) + (90×1.21) + (12×1.21) = 244.42
- AND workshop_total = (60×1.21) + (8×1.21) = 82.28
- AND net_profit = 162.14

### Requirement: Work Order Data Model (FR-030)

The system MUST store work orders with these fields (changed fields marked):

| Field | Type | Constraint |
|-------|------|-----------|
| id | INTEGER | PK, auto-increment |
| vehicle_id | INTEGER | FK → vehicles.id, REQUIRED |
| customer_id | INTEGER | FK → customers.id, REQUIRED |
| quote_id | INTEGER | FK → quotes.id, NULLABLE |
| order_number | TEXT | UNIQUE, auto-generated: WO-YYYYMMDD-NNN |
| date_in | TEXT | ISO 8601 date, REQUIRED |
| date_out | TEXT | ISO 8601 date, OPTIONAL |
| mileage_in | INTEGER | OPTIONAL, ≥ 0 |
| mileage_out | INTEGER | OPTIONAL, ≥ mileage_in if both set |
| description | TEXT | REQUIRED |
| labor_hours | REAL | OPTIONAL, default 0, ≥ 0 |
| hourly_rate | REAL | EDITABLE, defaults to settings.hourly_rate or inherited from quote |
| vat_rate | REAL | Snapshot of settings.vat_rate at creation, ≥ 0 |
| customer_total | REAL | Auto-calculated (see FR-034) |
| workshop_total | REAL | Auto-calculated (see FR-034) |
| payment_status | TEXT | ENUM: pending, partial, paid. Based on payments vs customer_total |
| notes | TEXT | OPTIONAL |
| created_at | TEXT | ISO 8601, auto-set |
| updated_at | TEXT | ISO 8601, auto-updated |

(Previously: single total_cost and parts_cost fields, no vat_rate)

#### Scenario: Auto-generate order number

- GIVEN today is 2026-08-26 and 5 work orders were created today
- WHEN the user creates a new work order
- THEN order_number is "WO-20260826-006"
