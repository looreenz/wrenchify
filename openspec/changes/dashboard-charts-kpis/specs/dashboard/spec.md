# Dashboard Specification

## Purpose

Single-screen business overview for the shop owner: KPIs with month-over-month comparison, revenue trend, and operational snapshot.

## Requirements

### Requirement: Dashboard Landing Page

The system MUST route `/` to `/dashboard`. The dashboard MUST appear as the first item in the sidebar navigation.

#### Scenario: App launch lands on dashboard

- GIVEN the user opens the application
- WHEN the app loads with path `/`
- THEN the router redirects to `/dashboard`

#### Scenario: Sidebar shows dashboard first

- GIVEN the sidebar navigation renders
- WHEN the menu items are displayed
- THEN "Dashboard" is the first item, before Customers

### Requirement: KPI Cards with Month-over-Month Comparison

The system MUST display 4 KPI cards in a row. Each card MUST show: current period value, previous period value, absolute delta, and percentage change.

| KPI | Current Value | Previous Value | Delta | Percentage |
|-----|--------------|----------------|-------|------------|
| All cards | Value for selected period | Value for equivalent prior period | current - previous | (delta / previous) * 100 |

#### Scenario: KPI card renders comparison

- GIVEN current month profit is €5,000 and previous month was €4,000
- WHEN the dashboard loads
- THEN the profit card shows €5,000 with delta +€1,000 (+25%)

#### Scenario: First month — no previous period data

- GIVEN no work orders or quotes exist in the previous period
- WHEN the dashboard loads
- THEN MoM comparison fields show "N/A" for delta and percentage

### Requirement: Monthly Profit KPI

Profit MUST equal `SUM(customer_total) - SUM(workshop_total)` for work orders where `date_in` falls within the selected period.

#### Scenario: Calculate monthly profit

- GIVEN 3 work orders in period: (customer_total=500, workshop_total=300), (200, 100), (800, 600)
- WHEN the dashboard computes KPIs
- THEN profit = €500 (200 + 100 + 200)

### Requirement: Monthly Revenue KPI

Revenue MUST equal `SUM(customer_total)` for work orders where `date_in` falls within the selected period.

#### Scenario: Calculate monthly revenue

- GIVEN 3 work orders in period with customer_total: 500, 200, 800
- WHEN the dashboard computes KPIs
- THEN revenue = €1,500

### Requirement: Pending Work Orders KPI

The system MUST display the COUNT of work orders where `payment_status = 'pending'`. This is a point-in-time snapshot, NOT filtered by date range.

#### Scenario: Count pending work orders

- GIVEN 15 work orders total: 8 pending, 4 partial, 3 paid
- WHEN the dashboard loads
- THEN pending work orders KPI shows 8

### Requirement: Quote Conversion Rate KPI

Conversion rate MUST equal `(count of accepted + count of converted quotes) / total quotes` within the selected period, expressed as a percentage rounded to whole number.

#### Scenario: Calculate conversion rate

- GIVEN 10 quotes in period: 3 draft, 2 accepted, 1 rejected, 4 converted
- WHEN the dashboard computes KPIs
- THEN conversion rate = 60% ((2 + 4) / 10)

#### Scenario: No quotes in period

- GIVEN zero quotes exist in the selected period
- WHEN the dashboard loads
- THEN conversion rate card shows "N/A"

### Requirement: Revenue Trend Chart

The system MUST render a vertical bar chart showing monthly revenue for the last 12 months relative to the selected period. Each bar represents one month's `SUM(customer_total)` for work orders with `date_in` in that month.

#### Scenario: Render 12-month chart

- GIVEN work orders spanning 14 months exist
- WHEN the dashboard loads with current month selected
- THEN the chart shows 12 bars (current month and 11 prior months)

#### Scenario: Months with no revenue

- GIVEN March and July have no work orders
- WHEN the chart renders
- THEN those months show bars with zero height and label "€0"

### Requirement: Date Range Filter

The system MUST provide preset date ranges and a custom range picker. Changing the filter MUST recompute all KPIs and chart data.

| Preset | Start | End |
|--------|-------|-----|
| Current month | 1st of current month | Today |
| Previous month | 1st of previous month | Last day of previous month |
| Current year | Jan 1 current year | Today |
| Custom | User-selected | User-selected |

#### Scenario: Select preset range

- GIVEN dashboard shows current month data
- WHEN the user selects "Current year"
- THEN all KPIs and chart recalculate for Jan 1 through today

#### Scenario: Select custom range

- GIVEN the dashboard is loaded
- WHEN the user picks 2026-03-01 to 2026-05-31
- THEN KPIs and chart reflect only records within that range

### Requirement: Empty State

When no data exists for the selected period, the system MUST display a friendly empty state — not errors, blank cards, or misleading zeros.

#### Scenario: Fresh install — no data at all

- GIVEN the database has zero work orders and zero quotes
- WHEN the dashboard loads
- THEN an empty state message appears encouraging the user to create their first work order or quote

### Requirement: i18n Coverage

All dashboard labels, KPI names, chart title, date range presets, empty state messages, and "N/A" indicators MUST have translations in both IT and ES via `vue-i18n` keys.

#### Scenario: Locale switch

- GIVEN the app language is set to Italian
- WHEN the dashboard renders
- THEN all text content displays in Italian (e.g., "Ricavo mensile" instead of "Monthly Revenue")

## Dependencies

| Dependency | Type | Notes |
|-----------|------|-------|
| `work-order-management` | Data | `customer_total`, `workshop_total`, `payment_status`, `date_in` |
| `quoting` | Data | `status`, `date` for conversion rate |
| `i18n` | Infrastructure | Translation keys for IT/ES |

## Out of Scope

PDF/CSV export, real-time updates, per-user customization, KPI drill-down navigation.
