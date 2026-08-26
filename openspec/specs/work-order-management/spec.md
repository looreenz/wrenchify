# Work Order Management Specification

## Purpose

Manage work orders — the core operational entity. Work orders track repair jobs from intake to completion, including line items, costs, and payment status.

## ADDED Requirements

### Requirement: Work Order Data Model (FR-030)

The system MUST store work orders with these fields:

| Field | Type | Constraint |
|-------|------|-----------|
| id | INTEGER | PK, auto-increment |
| vehicle_id | INTEGER | FK → vehicles.id, REQUIRED |
| customer_id | INTEGER | FK → customers.id, REQUIRED (denormalized) |
| quote_id | INTEGER | FK → quotes.id, NULLABLE |
| order_number | TEXT | UNIQUE, auto-generated: WO-YYYYMMDD-NNN |
| date_in | TEXT | ISO 8601 date, REQUIRED |
| date_out | TEXT | ISO 8601 date, OPTIONAL |
| mileage_in | INTEGER | OPTIONAL, ≥ 0 |
| mileage_out | INTEGER | OPTIONAL, ≥ mileage_in if both set |
| description | TEXT | REQUIRED |
| labor_hours | REAL | OPTIONAL, default 0, ≥ 0 |
| hourly_rate | REAL | EDITABLE, defaults to settings.hourly_rate (or inherited from quote if converted), can be overridden per work order |
| parts_cost | REAL | OPTIONAL, default 0, ≥ 0 |
| total_cost | REAL | Auto-calculated (see FR-034) |
| payment_status | TEXT | ENUM: pending, partial, paid. Auto-calculated (see FR-035) |
| notes | TEXT | OPTIONAL |
| created_at | TEXT | ISO 8601, auto-set |
| updated_at | TEXT | ISO 8601, auto-updated |

#### Scenario: Auto-generate order number

- GIVEN today is 2026-08-26 and 5 work orders were created today
- WHEN the user creates a new work order
- THEN order_number is "WO-20260826-006"

### Requirement: Work Order Line Items (FR-031)

The system MUST store line items in a `work_order_items` table:

| Field | Type | Constraint |
|-------|------|-----------|
| id | INTEGER | PK, auto-increment |
| work_order_id | INTEGER | FK → work_orders.id, REQUIRED |
| description | TEXT | REQUIRED |
| quantity | REAL | REQUIRED, > 0 |
| unit_price | REAL | REQUIRED, ≥ 0 |
| item_type | TEXT | ENUM: parts, labor |

#### Scenario: Add line item

- GIVEN work order WO-20260826-001 is open for editing
- WHEN the user adds a line item: "Brake pads", qty 2, unit_price 35.00, type "parts"
- THEN the item is saved and total_cost is recalculated

#### Scenario: Remove line item

- GIVEN a work order has 3 line items
- WHEN the user removes the second item
- THEN the item is deleted and total_cost is recalculated

### Requirement: Work Order List View (FR-032)

The system MUST display a filterable list: order_number, customer name, vehicle plate, date_in, total_cost, payment_status.

#### Scenario: Filter by date range

- GIVEN work orders spanning January to August 2026
- WHEN the user sets date range to "2026-06-01" to "2026-06-30"
- THEN only work orders with date_in in June are shown

#### Scenario: Filter by payment status

- GIVEN 10 work orders (6 pending, 2 partial, 2 paid)
- WHEN the user filters by "pending"
- THEN only the 6 pending work orders are shown

### Requirement: Work Order Create/Edit Form (FR-033)

The system MUST provide a form for creating and editing work orders, including inline line item management.

#### Scenario: Create work order from scratch

- GIVEN the user selects a customer and vehicle
- WHEN the user fills in description, date_in, labor_hours, and saves
- THEN the work order is created with payment_status 'pending'

#### Scenario: Mileage validation

- GIVEN mileage_in is 50000
- WHEN the user enters mileage_out as 49000
- THEN the form shows a validation error: "Mileage out must be ≥ mileage in"

### Requirement: Total Cost Auto-Calculation (FR-034)

total_cost MUST be calculated as: `(labor_hours × hourly_rate) + parts_cost + SUM(item.quantity × item.unit_price for all line items)`. Recalculated on every save.

#### Scenario: Calculate total with line items

- GIVEN labor_hours=2, hourly_rate=50, parts_cost=0, and 2 line items: (brake pads: 2×35=70) and (oil filter: 1×12=12)
- WHEN the work order is saved
- THEN total_cost = (2×50) + 0 + 70 + 12 = 182.00

### Requirement: Payment Status Auto-Update (FR-035)

payment_status MUST be automatically set based on sum of payments vs total_cost:
- sum = 0 → 'pending'
- 0 < sum < total_cost → 'partial'
- sum ≥ total_cost → 'paid'

#### Scenario: Status transitions with payments

- GIVEN work order with total_cost 200.00 and payment_status 'pending'
- WHEN a payment of 100.00 is recorded
- THEN payment_status becomes 'partial'
- WHEN a second payment of 100.00 is recorded
- THEN payment_status becomes 'paid'

## Constraints

- order_number: auto-generated, format WO-YYYYMMDD-NNN
- mileage_out ≥ mileage_in when both are provided
- total_cost: always auto-calculated, never manually editable
- payment_status: always auto-calculated from payment sum, never manually set
- hourly_rate: EDITABLE per work order, defaults to settings.hourly_rate (or inherited from quote). Changing global rate later does NOT affect existing work orders.
- Line items: quantity MUST be > 0, unit_price MUST be ≥ 0

## Dependencies

- `customer-management`: work orders reference customer_id
- `vehicle-management`: work orders reference vehicle_id; vehicle delete is RESTRICTED by work orders
- `quoting`: work orders MAY reference a quote_id (from conversion), inheriting hourly_rate
- `payment-tracking`: payments update the auto-calculated payment_status
- `app-settings`: hourly_rate used as default when creating work orders (can be overridden)
- `i18n`: all UI strings use translation keys
