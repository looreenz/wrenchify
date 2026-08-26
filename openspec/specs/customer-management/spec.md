# Customer Management Specification

## Purpose

Manage customer records for the auto repair shop. Customers are the root entity — vehicles, quotes, work orders, and payments all trace back to a customer.

## ADDED Requirements

### Requirement: Customer Data Model (FR-001)

The system MUST store customers with these fields:

| Field | Type | Constraint |
|-------|------|-----------|
| id | INTEGER | PK, auto-increment |
| first_name | TEXT | REQUIRED, max 100 chars |
| last_name | TEXT | REQUIRED, max 100 chars |
| phone | TEXT | OPTIONAL, max 30 chars |
| email | TEXT | OPTIONAL, valid email format if provided |
| address | TEXT | OPTIONAL, max 300 chars |
| fiscal_code | TEXT | OPTIONAL, max 20 chars |
| notes | TEXT | OPTIONAL |
| preferred_language | TEXT | DEFAULT 'it', MUST be 'it' or 'es' |
| created_at | TEXT | ISO 8601, auto-set |
| updated_at | TEXT | ISO 8601, auto-updated |

#### Scenario: Create customer with required fields

- GIVEN the customer form is open
- WHEN the user enters first_name "Mario" and last_name "Rossi" and submits
- THEN the customer is saved with id, created_at, updated_at, and preferred_language 'it'

#### Scenario: Reject missing required fields

- GIVEN the customer form is open
- WHEN the user submits with empty first_name
- THEN the form shows a validation error on first_name and does NOT save

### Requirement: Customer List View (FR-002)

The system MUST display a searchable, sortable list of all customers showing: full name, phone, email, preferred_language.

#### Scenario: Search by name

- GIVEN 50 customers exist in the database
- WHEN the user types "ross" in the search field
- THEN the list shows only customers whose first_name or last_name contains "ross" (case-insensitive)

#### Scenario: Empty state

- GIVEN no customers exist
- WHEN the customer list view loads
- THEN the system shows an empty state message with a "Create Customer" action

### Requirement: Customer Create/Edit Form (FR-003)

The system MUST provide a form for creating and editing customers with field validation.

#### Scenario: Edit existing customer

- GIVEN customer "Mario Rossi" exists
- WHEN the user opens the edit form, changes phone to "+39 333 1234567", and saves
- THEN the customer record is updated and updated_at is refreshed

#### Scenario: Email validation

- GIVEN the customer form is open
- WHEN the user enters email "not-an-email" and submits
- THEN the form shows a validation error on the email field

### Requirement: Customer Deletion (FR-004)

The system MUST allow deleting a customer. Deletion MUST cascade to all related vehicles.

#### Scenario: Delete customer with vehicles

- GIVEN customer "Mario Rossi" has 2 vehicles
- WHEN the user confirms deletion
- THEN the customer and both vehicles are deleted from the database

#### Scenario: Delete confirmation

- GIVEN the user clicks delete on a customer
- WHEN the confirmation dialog appears
- THEN it shows the customer name and count of vehicles that will also be deleted

### Requirement: Customer-Vehicle Relationship (FR-005)

The system MUST maintain a one-to-many relationship between customers and vehicles via customer_id foreign key.

#### Scenario: View customer vehicles

- GIVEN customer "Mario Rossi" has 3 vehicles
- WHEN the user navigates to the customer detail view
- THEN all 3 vehicles are listed with license plate, make, and model

## Constraints

- Email validation: RFC 5322 simplified (contains @ and domain)
- preferred_language restricted to enum: 'it', 'es'
- Cascade delete: customer deletion removes all associated vehicles
- Search: case-insensitive substring match on first_name and last_name

## Dependencies

- `vehicle-management`: vehicles reference customers via customer_id FK
- `i18n`: all UI strings use translation keys
