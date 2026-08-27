# Dual Pricing Specification

## Purpose

Per-item dual pricing (customer/workshop), VAT calculation, and net profit visibility for quotes and work orders.

## Requirements

### Requirement: Dual-Price Line Items (DP-001)

Every spare-part line item MUST carry two unit prices (both entered WITHOUT VAT):

| Field | Type | Constraint |
|-------|------|-----------|
| customer_price | REAL | REQUIRED, ≥ 0 — what the customer pays per unit |
| workshop_price | REAL | REQUIRED, ≥ 0 — what the workshop pays supplier per unit |

Labor items MAY use dual pricing. If omitted, workshop_price defaults to 0.

#### Scenario: Add spare part with dual pricing

- GIVEN the user is editing a quote or work order
- WHEN they add item "Brake pads", qty 2, customer_price 45.00, workshop_price 30.00
- THEN the item is saved with both prices

#### Scenario: Validate non-negative prices

- GIVEN the line item editor is open
- WHEN the user enters customer_price as -5.00
- THEN the form shows: "Price must be 0 or greater"

### Requirement: VAT Calculation Engine (DP-002)

The system MUST apply the global `vat_rate` (from settings) to all line items. VAT is calculated per-item then summed:

- `item_customer_total = customer_price × qty × (1 + vat_rate)`
- `item_workshop_total = workshop_price × qty × (1 + vat_rate)`
- `document_customer_total = SUM(item_customer_total)`
- `document_workshop_total = SUM(item_workshop_total)`

#### Scenario: Calculate totals with 21% VAT

- GIVEN vat_rate = 0.21, item: customer_price 100, workshop_price 70, qty 1
- WHEN the document is saved
- THEN customer_total = 121.00, workshop_total = 84.70

#### Scenario: Recalculate when VAT rate changes

- GIVEN a draft quote with existing items
- WHEN the user changes the global vat_rate to 0.22
- THEN all draft document totals are recalculated on next save

### Requirement: Net Profit Calculation (DP-003)

The system MUST calculate and display net profit per document:

- `net_profit = document_customer_total - document_workshop_total`

Profit MUST be visible in the form summary area. It is an internal metric, never shown to customers.

#### Scenario: Display profit summary

- GIVEN customer_total 242.00, workshop_total 169.40
- WHEN the form renders the summary
- THEN net profit shows 72.60

### Requirement: Customer-Facing Visibility (DP-004)

Customer-facing outputs (printed quotes, printed invoices, PDF exports) MUST show ONLY customer_price and customer_total (with VAT). Workshop prices and net profit MUST NOT appear in any customer-facing view.

#### Scenario: Customer quote printout

- GIVEN a quote with dual-priced items
- WHEN the user prints or exports the quote for the customer
- THEN only customer prices + VAT are visible; workshop_price and profit columns are absent

#### Scenario: Internal work order view

- GIVEN the same work order viewed internally
- WHEN the workshop operator opens the detail view
- THEN both customer and workshop prices are visible, plus net profit
