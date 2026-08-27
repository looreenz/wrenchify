# Delta for Work Order Management

## ADDED Requirements

### Requirement: Work Order Views Theme Conformance (WO-T01)

All work order views (list, form, detail) MUST use design tokens from the theme-system. Payment status MUST use `StatusLamp` components. Data grids MUST use high-contrast table styling with vertical column separators.

| Payment Status | Lamp Color |
|---------------|-----------|
| pending | `--bi-hazard-yellow` (#FDE047) |
| partial | `--bi-primary` (#ffb693) |
| paid | `#4ade80` (emerald) |

#### Scenario: Work order data grid styling

- GIVEN the work order list table renders with multiple columns
- WHEN inspected
- THEN rows have `--bi-surface-container` hover background, vertical column separators, and high-contrast text

#### Scenario: Payment status lamps in work order list

- GIVEN work orders with payment statuses pending, partial, and paid
- WHEN the list renders
- THEN each row shows the appropriate `StatusLamp` color next to the payment status text

#### Scenario: Line items table in work order form

- GIVEN the work order form displays line items in an editable table
- WHEN rendered
- THEN the table uses `--bi-surface-container-high` for header background and `var(--bi-font-mono)` for numeric columns
