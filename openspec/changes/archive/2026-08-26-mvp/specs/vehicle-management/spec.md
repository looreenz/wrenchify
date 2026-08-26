# Vehicle Management Specification

## Purpose

Manage vehicles linked to customers. Each vehicle belongs to exactly one customer and is identified by a unique license plate.

## ADDED Requirements

### Requirement: Vehicle Data Model (FR-010)

The system MUST store vehicles with these fields:

| Field | Type | Constraint |
|-------|------|-----------|
| id | INTEGER | PK, auto-increment |
| customer_id | INTEGER | FK → customers.id, REQUIRED |
| license_plate | TEXT | UNIQUE, REQUIRED, max 20 chars |
| make | TEXT | REQUIRED, max 50 chars |
| model | TEXT | REQUIRED, max 50 chars |
| year | INTEGER | OPTIONAL, 1900–current year |
| vin | TEXT | OPTIONAL, max 17 chars |
| notes | TEXT | OPTIONAL |
| created_at | TEXT | ISO 8601, auto-set |
| updated_at | TEXT | ISO 8601, auto-updated |

#### Scenario: Create vehicle with unique plate

- GIVEN customer "Mario Rossi" exists
- WHEN the user creates a vehicle with plate "AB123CD"
- THEN the vehicle is saved linked to Mario Rossi's customer_id

#### Scenario: Reject duplicate license plate

- GIVEN a vehicle with plate "AB123CD" already exists
- WHEN the user attempts to create another vehicle with plate "AB123CD"
- THEN the system rejects the save with a "License plate already registered" error

### Requirement: Vehicle List View (FR-011)

The system MUST display vehicles filtered by customer. The list shows: license_plate, make, model, year.

#### Scenario: List vehicles for a customer

- GIVEN customer "Mario Rossi" has 3 vehicles
- WHEN the user opens the vehicles tab for that customer
- THEN exactly 3 vehicles are shown

#### Scenario: Empty vehicle list

- GIVEN a customer with no vehicles
- WHEN the vehicles tab loads
- THEN the system shows an empty state with "Add Vehicle" action

### Requirement: Vehicle Create/Edit Form (FR-012)

The system MUST provide a form scoped to a specific customer (customer_id pre-filled and non-editable).

#### Scenario: Year validation

- GIVEN the vehicle form is open
- WHEN the user enters year 2030 (future year)
- THEN the form shows a validation error

#### Scenario: Edit vehicle plate

- GIVEN vehicle "AB123CD" exists for customer Rossi
- WHEN the user changes plate to "XY999ZZ" and saves
- THEN the plate is updated (if no other vehicle has "XY999ZZ")

### Requirement: Vehicle Deletion (FR-013)

The system MUST block vehicle deletion if work orders exist for that vehicle (RESTRICT). If no work orders exist, deletion MUST succeed.

#### Scenario: Delete vehicle with work orders

- GIVEN vehicle "AB123CD" has 1 work order
- WHEN the user attempts to delete the vehicle
- THEN the system blocks deletion with message "Cannot delete: vehicle has existing work orders"

#### Scenario: Delete vehicle without work orders

- GIVEN vehicle "AB123CD" has no work orders
- WHEN the user confirms deletion
- THEN the vehicle is removed from the database

### Requirement: Vehicle-Customer Linkage (FR-014)

Every vehicle MUST belong to exactly one customer. The system MUST NOT allow orphan vehicles.

#### Scenario: Cannot create vehicle without customer

- GIVEN no customer is selected
- WHEN the user tries to access the vehicle creation form
- THEN the system redirects to customer selection or shows an error

## Constraints

- license_plate: UNIQUE constraint at database level, case-insensitive comparison (stored uppercase)
- year: integer, 1900 ≤ year ≤ current calendar year
- vin: optional, max 17 alphanumeric characters
- RESTRICT delete: foreign key prevents deletion when work_orders reference the vehicle
- Cascade from customer: when a customer is deleted, all their vehicles are deleted (handled by customer-management)

## Dependencies

- `customer-management`: vehicles require a valid customer_id FK
- `work-order-management`: work orders reference vehicles; RESTRICT on vehicle delete
- `quoting`: quotes reference vehicles
- `i18n`: all UI strings use translation keys
