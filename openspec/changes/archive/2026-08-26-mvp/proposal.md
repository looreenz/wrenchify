# Proposal: Wrenchify MVP

## Intent

Small auto repair shop (single-user, parents' business) currently relies on paper tracking. Wrenchify replaces it with a desktop app for customers, vehicles, quotes, work orders, payments, and service history. Bilingual (IT/ES), 100% offline, single-file SQLite database.

## Scope

### In Scope
- Customer CRUD with fiscal code and preferred language
- Vehicle CRUD linked to customers (license plate unique)
- Quotes with statuses (draft/accepted/rejected/converted); convert to work order
- Work orders with line items (parts/labor), direct or from quote conversion
- Multiple partial payments per work order (cash/card/transfer)
- Vehicle timeline: full service history with mileage progression
- Settings: global hourly rate, default language, shop name
- Bilingual UI (IT/ES) with runtime switching via vue-i18n
- Auto-backup on close (last 3 copies) + manual export

### Out of Scope
- Document generation (PDFs, printable receipts/invoices)
- Multi-user / multi-mechician support / auth
- Cloud sync, mobile app
- External parts catalog integration

## Capabilities

### New Capabilities
- `customer-management`: CRUD for customers with contact info, fiscal code, preferred language
- `vehicle-management`: CRUD for vehicles linked to customers, unique license plate
- `quoting`: Quote lifecycle (draft→accepted/rejected), conversion to work order
- `work-order-management`: Work order CRUD with line items, status tracking, quote linkage
- `payment-tracking`: Multiple partial payments per work order with method and date
- `vehicle-timeline`: Chronological service history view per vehicle with mileage progression
- `app-settings`: Hourly rate, default language, shop name, currency
- `data-backup`: Auto-backup on close (last 3), manual export/restore
- `i18n`: Bilingual IT/ES runtime switching via vue-i18n JSON dictionaries

### Modified Capabilities
None (greenfield project).

## Approach

Electron + Vue 3 (Composition API) + Pinia + Naive UI + Lucide icons. SQLite via better-sqlite3 in main process; renderer communicates through IPC. vue-i18n with JSON dictionaries. WAL mode enabled. Data at `app.getPath('userData')` with portable mode option. Auto-backup copies SQLite file on close.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/main/` | New | Electron main process, IPC handlers, auto-backup |
| `src/db/` | New | Schema, migrations, CRUD repositories |
| `src/preload/` | New | Secure IPC bridge |
| `src/renderer/` | New | Vue 3 app shell, router, layouts |
| `src/renderer/views/` | New | One view per capability |
| `src/renderer/components/` | New | Shared UI components |
| `src/renderer/stores/` | New | Pinia stores per capability |
| `src/i18n/` | New | it.json, es.json dictionaries |
| `build/` | New | electron-builder config |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| better-sqlite3 native build failures | Med | Use prebuild binaries + electron-rebuild |
| Data corruption | Low | WAL mode + auto-backup (last 3 copies) |

## Rollback Plan

Greenfield — delete project directory. No production data at risk.

## Dependencies

- Node.js 18+ and npm
- Electron + better-sqlite3 with prebuild binaries for target platforms

## Success Criteria

- [ ] App launches with double-click (no terminal, no Docker)
- [ ] Works 100% offline
- [ ] Data persists in single SQLite file
- [ ] Bilingual UI (IT/ES) with runtime switching
- [ ] Full CRUD: customers, vehicles, quotes, work orders, payments
- [ ] Quote-to-work-order conversion preserves all data
- [ ] Vehicle timeline shows complete service history with mileage
- [ ] Auto-backup on close (last 3 copies retained)
