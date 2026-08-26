# Quoting Specification

## Purpose

Manage the quote lifecycle: creation, acceptance/rejection, and conversion to work orders. Quotes estimate costs before work begins.

## ADDED Requirements

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
| hourly_rate | REAL | EDITABLE, defaults to settings.hourly_rate at creation, can be overridden per quote |
| parts_cost | REAL | OPTIONAL, default 0, ≥ 0 |
| total_cost | REAL | Auto-calculated: (labor_hours × hourly_rate) + parts_cost |
| notes | TEXT | OPTIONAL |
| created_at | TEXT | ISO 8601, auto-set |
| updated_at | TEXT | ISO 8601, auto-updated |

#### Scenario: Auto-generate quote number

- GIVEN today is 2026-08-26 and 2 quotes were created today
- WHEN the user creates a new quote
- THEN quote_number is "Q-20260826-003"

#### Scenario: Auto-calculate total cost

- GIVEN hourly_rate is 50.00, labor_hours is 3.0, parts_cost is 120.00
- WHEN the quote is saved
- THEN total_cost is calculated as (3.0 × 50.00) + 120.00 = 270.00

### Requirement: Quote List View (FR-021)

The system MUST display a list of quotes with: quote_number, customer name, vehicle plate, date, status, total_cost. Filterable by status.

#### Scenario: Filter by status

- GIVEN 20 quotes exist (10 draft, 5 accepted, 3 rejected, 2 converted)
- WHEN the user selects "accepted" in the status filter
- THEN only the 5 accepted quotes are shown

### Requirement: Quote Create/Edit Form (FR-022)

The system MUST provide a form for creating and editing quotes. Editing is only allowed when status is 'draft'.

#### Scenario: Edit draft quote

- GIVEN quote Q-20260826-001 has status 'draft'
- WHEN the user changes labor_hours and saves
- THEN total_cost is recalculated and the quote is updated

#### Scenario: Block edit on non-draft quote

- GIVEN quote Q-20260826-001 has status 'accepted'
- WHEN the user attempts to edit the quote
- THEN the form fields are read-only and a message says "Accepted quotes cannot be edited"

### Requirement: Accept/Reject Quote (FR-023)

The system MUST allow transitioning a quote from 'draft' to 'accepted' or 'rejected'.

#### Scenario: Accept a draft quote

- GIVEN quote Q-20260826-001 has status 'draft'
- WHEN the user clicks "Accept"
- THEN status changes to 'accepted'

#### Scenario: Reject a draft quote

- GIVEN quote Q-20260826-001 has status 'draft'
- WHEN the user clicks "Reject"
- THEN status changes to 'rejected'

### Requirement: Convert Quote to Work Order (FR-024)

The system MUST allow converting an 'accepted' quote into a work order. The quote status becomes 'converted'. The work order inherits quote data.

#### Scenario: Convert accepted quote

- GIVEN quote Q-20260826-001 has status 'accepted', total_cost 270.00
- WHEN the user clicks "Convert to Work Order"
- THEN a new work order is created with the same vehicle_id, customer_id, description, labor_hours, parts_cost, total_cost
- AND the quote status changes to 'converted'
- AND the work order's quote_id references the original quote

#### Scenario: Block conversion of non-accepted quote

- GIVEN quote Q-20260826-001 has status 'draft'
- WHEN the user attempts to convert
- THEN the "Convert" button is disabled

## Constraints

- quote_number: auto-generated, format Q-YYYYMMDD-NNN (NNN = sequential daily counter, zero-padded to 3 digits)
- hourly_rate: EDITABLE per quote, defaults to settings.hourly_rate at creation. Changing global rate later does NOT affect existing quotes.
- Status transitions: draft → accepted | rejected; accepted → converted. No backward transitions.
- total_cost: always recalculated on save, never manually editable
- Editing restricted to 'draft' status only

## Dependencies

- `customer-management`: quotes reference customer_id
- `vehicle-management`: quotes reference vehicle_id
- `work-order-management`: conversion creates a work order linked back via quote_id
- `app-settings`: hourly_rate used as default when creating quotes (can be overridden)
- `i18n`: all UI strings use translation keys
