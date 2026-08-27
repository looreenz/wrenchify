# Delta for Quoting

## ADDED Requirements

### Requirement: Quote Line Items (FR-025)

The system MUST store quote line items in a `quote_items` table:

| Field | Type | Constraint |
|-------|------|-----------|
| id | INTEGER | PK, auto-increment |
| quote_id | INTEGER | FK → quotes.id, REQUIRED |
| description | TEXT | REQUIRED |
| quantity | REAL | REQUIRED, > 0 |
| customer_price | REAL | REQUIRED, ≥ 0 |
| workshop_price | REAL | REQUIRED, ≥ 0 |
| item_type | TEXT | ENUM: parts, labor |

#### Scenario: Add quote line item

- GIVEN a draft quote is open for editing
- WHEN the user adds "Oil filter", qty 1, customer_price 15.00, workshop_price 8.00
- THEN the item is saved and customer_total is recalculated

## MODIFIED Requirements

### Requirement: Quote Data Model (FR-020)

The system MUST store quotes with these fields:

| Field | Type | Constraint |
|-------|------|-----------|
| id | INTEGER | PK, auto-increment |
| vehicle_id | INTEGER | FK → vehicles.id, REQUIRED |
| customer_id | INTEGER | FK → customers.id, REQUIRED (denormalized for queries) |
| quote_number | TEXT | UNIQUE, auto-generated, format: Q-YYYYMMDD-NNN |
| date | TEXT | ISO 8601 date, auto-set to today |
| status | TEXT | ENUM: draft, accepted, rejected, converted |
| description | TEXT | REQUIRED |
| labor_hours | REAL | OPTIONAL, default 0, ≥ 0 |
| hourly_rate | REAL | EDITABLE, defaults to settings.hourly_rate at creation |
| vat_rate | REAL | Snapshot of settings.vat_rate at creation, ≥ 0 |
| customer_total | REAL | Auto-calculated: labor + SUM(quote_items customer totals with VAT) |
| workshop_total | REAL | Auto-calculated: SUM(quote_items workshop totals with VAT) |
| notes | TEXT | OPTIONAL |
| created_at | TEXT | ISO 8601, auto-set |
| updated_at | TEXT | ISO 8601, auto-updated |

(Previously: flat parts_cost and single total_cost field)

#### Scenario: Auto-generate quote number

- GIVEN today is 2026-08-26 and 2 quotes were created today
- WHEN the user creates a new quote
- THEN quote_number is "Q-20260826-003"

#### Scenario: Auto-calculate totals with line items

- GIVEN hourly_rate 50.00, labor_hours 3.0, vat_rate 0.21, one item: customer_price 100, workshop_price 70, qty 1
- WHEN the quote is saved
- THEN customer_total = (3.0 × 50.00) + (100 × 1.21) = 271.00
- AND workshop_total = 70 × 1.21 = 84.70

### Requirement: Quote Create/Edit Form (FR-022)

The system MUST provide a form for creating and editing quotes with an embedded line items editor supporting dual pricing. Editing is only allowed when status is 'draft'.

(Previously: form had no line items editor, only flat parts_cost field)

#### Scenario: Edit draft quote with line items

- GIVEN quote Q-20260826-001 has status 'draft' and 2 line items
- WHEN the user modifies an item's customer_price and saves
- THEN customer_total and workshop_total are recalculated

#### Scenario: Block edit on non-draft quote

- GIVEN quote Q-20260826-001 has status 'accepted'
- WHEN the user attempts to edit the quote
- THEN the form fields and line items editor are read-only

### Requirement: Convert Quote to Work Order (FR-024)

The system MUST allow converting an 'accepted' quote into a work order. The quote status becomes 'converted'. All `quote_items` are carried over 1:1 to `work_order_items` preserving dual prices and quantities.

(Previously: conversion copied flat parts_cost only)

#### Scenario: Convert accepted quote with line items

- GIVEN accepted quote with 2 line items (dual-priced)
- WHEN the user clicks "Convert to Work Order"
- THEN a new work order is created with the same items, dual prices, vat_rate, and totals
- AND the quote status changes to 'converted'

#### Scenario: Block conversion of non-accepted quote

- GIVEN quote with status 'draft'
- WHEN the user attempts to convert
- THEN the "Convert" button is disabled
