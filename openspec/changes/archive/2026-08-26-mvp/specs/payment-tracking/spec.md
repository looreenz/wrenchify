# Payment Tracking Specification

## Purpose

Track multiple payments per work order. Payments can be edited or deleted to correct mistakes, but only while the work order is not yet fully paid.

## ADDED Requirements

### Requirement: Payment Data Model (FR-040)

The system MUST store payments with these fields:

| Field | Type | Constraint |
|-------|------|-----------|
| id | INTEGER | PK, auto-increment |
| work_order_id | INTEGER | FK → work_orders.id, REQUIRED |
| amount | REAL | REQUIRED, > 0 |
| payment_method | TEXT | ENUM: cash, card, transfer, REQUIRED |
| payment_date | TEXT | ISO 8601 date, REQUIRED, default today |
| notes | TEXT | OPTIONAL |
| created_at | TEXT | ISO 8601, auto-set |
| updated_at | TEXT | ISO 8601, auto-updated |

#### Scenario: Record a cash payment

- GIVEN work order WO-20260826-001 with total_cost 200.00
- WHEN the user records a payment of 100.00, method "cash", date today
- THEN the payment is saved and work order payment_status becomes 'partial'

#### Scenario: Record payment exceeding total cost

- GIVEN work order with total_cost 200.00 and existing payments summing to 150.00
- WHEN the user records a payment of 100.00
- THEN the payment is saved (overpayment allowed) and payment_status becomes 'paid'

### Requirement: Payment List View (FR-041)

The system MUST display all payments for a work order: amount, payment_method, payment_date, notes. Show running total and remaining balance.

#### Scenario: View payment history

- GIVEN work order with total_cost 300.00 and 2 payments (100.00 cash, 150.00 card)
- WHEN the user opens the payments view
- THEN both payments are listed with a running total of 250.00 and remaining balance of 50.00

#### Scenario: No payments yet

- GIVEN work order with no payments
- WHEN the payments view loads
- THEN the system shows "No payments recorded" with remaining balance equal to total_cost

### Requirement: Add Payment Form (FR-042)

The system MUST provide a form to add a new payment. Fields: amount (required, > 0), payment_method (required, dropdown), payment_date (required, date picker, default today), notes (optional).

#### Scenario: Validate amount

- GIVEN the payment form is open
- WHEN the user enters amount 0 or negative
- THEN the form shows a validation error: "Amount must be greater than 0"

#### Scenario: Default date

- GIVEN the payment form opens on 2026-08-26
- WHEN the form loads
- THEN payment_date defaults to 2026-08-26

### Requirement: Edit and Delete Payments (FR-043)

The system MUST allow editing and deleting payments, but ONLY while the parent work order's payment_status is NOT 'paid'. Once a work order is fully paid, payments become read-only to prevent accidental changes.

#### Scenario: Edit a payment

- GIVEN work order with payment_status 'partial' and a payment of 100.00
- WHEN the user edits the payment to 150.00 and saves
- THEN the payment is updated and work order payment_status is recalculated

#### Scenario: Delete a payment

- GIVEN work order with payment_status 'partial' and 2 payments
- WHEN the user deletes one payment (with confirmation)
- THEN the payment is removed and work order payment_status is recalculated

#### Scenario: Block edit on paid work order

- GIVEN work order with payment_status 'paid' and existing payments
- WHEN the user attempts to edit a payment
- THEN the edit action is disabled and a message says "Payments cannot be edited after work order is fully paid"

#### Scenario: Block delete on paid work order

- GIVEN work order with payment_status 'paid' and existing payments
- WHEN the user attempts to delete a payment
- THEN the delete action is disabled and a message says "Payments cannot be deleted after work order is fully paid"

### Requirement: Work Order Status Sync (FR-044)

After every payment insertion, update, or deletion, the system MUST recalculate and update the parent work order's payment_status.

#### Scenario: First payment triggers partial

- GIVEN work order with total_cost 500.00 and payment_status 'pending'
- WHEN a payment of 200.00 is added
- THEN work order payment_status updates to 'partial'

#### Scenario: Final payment triggers paid

- GIVEN work order with total_cost 500.00, existing payments 300.00, status 'partial'
- WHEN a payment of 200.00 is added
- THEN work order payment_status updates to 'paid'

#### Scenario: Edit payment changes status

- GIVEN work order with total_cost 500.00, payments summing to 500.00, status 'paid'
- WHEN a payment of 100.00 is edited to 50.00 (new sum: 450.00)
- THEN work order payment_status updates to 'partial'

#### Scenario: Delete payment changes status

- GIVEN work order with total_cost 500.00, payments summing to 500.00, status 'paid'
- WHEN a payment of 100.00 is deleted (new sum: 400.00)
- THEN work order payment_status updates to 'partial'

## Constraints

- amount: MUST be > 0 (strictly positive)
- Editable: payments CAN be edited or deleted, but ONLY while work order payment_status is NOT 'paid'
- Overpayment: allowed (sum of payments MAY exceed total_cost)
- payment_method: restricted to enum cash | card | transfer
- payment_date: MUST NOT be in the future
- Status lock: once work order reaches 'paid', all payments become read-only

## Dependencies

- `work-order-management`: payments reference work_order_id; payment insert/update/delete triggers payment_status recalculation; edit/delete blocked when payment_status is 'paid'
- `i18n`: all UI strings use translation keys
