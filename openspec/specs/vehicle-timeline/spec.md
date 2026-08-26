# Vehicle Timeline Specification

## Purpose

Provide a chronological service history view for each vehicle, showing all work orders with mileage progression. This is a read-only view — no editing.

## ADDED Requirements

### Requirement: Timeline Data Source (FR-050)

The system MUST aggregate all work orders for a given vehicle, ordered by date_in descending (most recent first).

#### Scenario: Load timeline for a vehicle

- GIVEN vehicle "AB123CD" has 5 work orders spanning 2024–2026
- WHEN the user opens the timeline view for this vehicle
- THEN all 5 work orders are displayed in reverse chronological order

#### Scenario: Empty timeline

- GIVEN a vehicle with no work orders
- WHEN the timeline view loads
- THEN the system shows "No service history for this vehicle"

### Requirement: Timeline Entry Display (FR-051)

Each timeline entry MUST show: date_in, date_out (if set), mileage_in, mileage_out, description, total_cost, payment_status.

#### Scenario: Complete entry display

- GIVEN a work order with date_in 2026-03-15, date_out 2026-03-16, mileage_in 45000, mileage_out 45200, description "Brake replacement", total_cost 280.00, payment_status 'paid'
- WHEN the timeline renders this entry
- THEN all fields are displayed with appropriate formatting (currency, date format per locale)

### Requirement: Mileage Progression Visualization (FR-052)

The system MUST display mileage progression across work orders, showing how mileage increases over time.

#### Scenario: Visual mileage track

- GIVEN 3 work orders with mileage_in values: 30000, 42000, 55000
- WHEN the timeline renders
- THEN a visual indicator shows mileage progression (e.g., a vertical line or bar connecting mileage values across entries)

#### Scenario: Single work order

- GIVEN a vehicle with only 1 work order
- WHEN the timeline renders
- THEN the mileage progression shows a single point (no line connecting to other entries)

### Requirement: Timeline Filters (FR-053)

The system MUST provide quick filters: date range (from/to) and payment_status.

#### Scenario: Filter by date range

- GIVEN 10 work orders spanning 2 years
- WHEN the user sets date range to last 6 months
- THEN only work orders with date_in within the last 6 months are shown

#### Scenario: Filter by payment status

- GIVEN work orders with mixed payment statuses
- WHEN the user selects "pending"
- THEN only work orders with payment_status 'pending' are shown

#### Scenario: Combined filters

- GIVEN the user sets both date range and payment_status filters
- WHEN the timeline loads
- THEN only work orders matching BOTH criteria are shown

### Requirement: Timeline Access Point (FR-054)

The system MUST provide access to the timeline from the vehicle detail view and the vehicle list.

#### Scenario: Navigate from vehicle list

- GIVEN the vehicle list shows vehicle "AB123CD"
- WHEN the user clicks the "Timeline" action on that vehicle
- THEN the timeline view opens for that vehicle

## Constraints

- Read-only view: no create, edit, or delete operations on timeline entries
- Data source: work_orders table filtered by vehicle_id
- Sorting: date_in DESC (most recent first)
- Mileage visualization: simple visual indicator (CSS-based), no charting library required for MVP
- Currency formatting: follows app-settings currency (EUR default)

## Dependencies

- `vehicle-management`: timeline is scoped to a single vehicle
- `work-order-management`: timeline aggregates work order data
- `app-settings`: currency format from settings
- `i18n`: all UI strings use translation keys
