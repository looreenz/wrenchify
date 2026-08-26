# Delta for Vehicle Management

## ADDED Requirements

### Requirement: Vehicle Views Theme Conformance (VM-T01)

All vehicle management views (list, form) MUST use design tokens from the theme-system. Vehicle data displays MUST use monospace font (`var(--bi-font-mono)`) for technical specifications (license plate, VIN, year).

#### Scenario: Vehicle list uses industrial cards

- GIVEN the vehicle list renders for a customer
- WHEN each vehicle is displayed
- THEN it is wrapped in an `IndustrialCard` with the license plate as the mono header

#### Scenario: Technical data in monospace

- GIVEN a vehicle detail shows license plate "AB123CD" and VIN "WVWZZ1JZ3WE123456"
- WHEN rendered
- THEN both values use `var(--bi-font-mono)` for aligned, technical presentation
