# Design: Wrenchify MVP

## Technical Approach

Single-process Electron app with Vue 3 SPA renderer. SQLite via better-sqlite3 in main process, exposed through secure IPC bridge. Repository pattern for data access, Pinia stores for reactive state, vue-i18n for bilingual UI. WAL mode enabled, auto-backup on close.

## Architecture Decisions

| Decision | Options | Tradeoff | Choice |
|----------|---------|----------|--------|
| **Process model** | Single main + renderer vs multi-window | Single is simpler, no sync complexity | Single main + one renderer window |
| **Database access** | Direct in renderer vs IPC to main | IPC is secure, main process owns DB | IPC bridge (contextBridge) |
| **Data layer** | ORM vs raw SQL vs repository pattern | Repository balances abstraction and control | Repository pattern with typed methods |
| **State management** | Vuex vs Pinia vs composables | Pinia is modern, TypeScript-friendly, simpler | Pinia with one store per domain |
| **UI framework** | Vuetify vs Naive UI vs Element Plus | Naive UI is lightweight, Vue 3 native, good DX | Naive UI |
| **Routing** | Vue Router vs manual | Vue Router is standard, supports guards | Vue Router with layout system |
| **i18n** | vue-i18n vs custom | vue-i18n is battle-tested, Composition API support | vue-i18n with JSON dictionaries |
| **Migrations** | Manual SQL vs migration tool | Manual is explicit, no magic, fits single-user | Manual versioned SQL files |
| **Backup strategy** | WAL checkpoint + file copy vs dump | File copy is atomic, preserves WAL state | Checkpoint + copy with FIFO rotation |

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Renderer Process (Vue 3 SPA)                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │  Views   │→ │  Stores  │→ │   API    │                  │
│  │  (UI)    │← │ (Pinia)  │← │ (bridge) │                  │
│  └──────────┘  └──────────┘  └────┬─────┘                  │
└────────────────────────────────────┼────────────────────────┘
                                     │ IPC (contextBridge)
┌────────────────────────────────────┼────────────────────────┐
│ Main Process (Node.js)             │                        │
│  ┌──────────┐  ┌──────────┐  ┌────┴─────┐                  │
│  │ Handlers │→ │   Repo   │→ │    DB    │                  │
│  │  (IPC)   │← │ (typed)  │← │ (SQLite) │                  │
│  └──────────┘  └──────────┘  └──────────┘                  │
└─────────────────────────────────────────────────────────────┘
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/main/index.ts` | Create | Electron main entry, window creation, IPC registration |
| `src/main/ipc/handlers.ts` | Create | IPC handlers for all repository methods |
| `src/preload/index.ts` | Create | contextBridge exposing typed API |
| `src/db/connection.ts` | Create | SQLite connection, WAL mode, migrations runner |
| `src/db/migrations/*.sql` | Create | Versioned schema migrations (001, 002, etc.) |
| `src/db/repositories/*.ts` | Create | Typed repositories per entity (customer, vehicle, quote, workOrder, payment, settings) |
| `src/renderer/index.ts` | Create | Vue app entry, router, Pinia, i18n setup |
| `src/renderer/router.ts` | Create | Vue Router with routes and layout guards |
| `src/renderer/layouts/MainLayout.vue` | Create | Sidebar nav + content area layout |
| `src/renderer/views/**/*.vue` | Create | Views per capability (CustomerList, VehicleDetail, etc.) |
| `src/renderer/stores/*.ts` | Create | Pinia stores (customers, vehicles, quotes, workOrders, payments, settings) |
| `src/renderer/components/**/*.vue` | Create | Shared components (DataTable, FormField, StatusBadge, etc.) |
| `src/i18n/it.json` | Create | Italian translations |
| `src/i18n/es.json` | Create | Spanish translations |
| `src/i18n/index.ts` | Create | vue-i18n setup, locale loader |
| `src/shared/types.ts` | Create | Shared TypeScript interfaces (Customer, Vehicle, Quote, etc.) |
| `package.json` | Create | Dependencies, scripts (dev, build, rebuild) |
| `electron-builder.yml` | Create | Build config for Windows/macOS/Linux |
| `vite.config.ts` | Create | Vite config for renderer bundling |
| `tsconfig.json` | Create | TypeScript config |

## Interfaces / Contracts

### IPC Bridge API (exposed via contextBridge)

```typescript
interface WrenchifyAPI {
  // Customers
  customers: {
    list(filter?: { search?: string }): Promise<Customer[]>
    getById(id: number): Promise<Customer | null>
    create(data: CustomerCreate): Promise<Customer>
    update(id: number, data: CustomerUpdate): Promise<Customer>
    delete(id: number): Promise<void>
  }
  
  // Vehicles
  vehicles: {
    list(customerId?: number): Promise<Vehicle[]>
    getById(id: number): Promise<Vehicle | null>
    create(data: VehicleCreate): Promise<Vehicle>
    update(id: number, data: VehicleUpdate): Promise<Vehicle>
    delete(id: number): Promise<void>
    getTimeline(vehicleId: number, filter?: TimelineFilter): Promise<WorkOrder[]>
  }
  
  // Quotes
  quotes: {
    list(filter?: QuoteFilter): Promise<Quote[]>
    getById(id: number): Promise<Quote | null>
    create(data: QuoteCreate): Promise<Quote>
    update(id: number, data: QuoteUpdate): Promise<Quote>
    delete(id: number): Promise<void>
    convert(id: number): Promise<WorkOrder>
  }
  
  // Work Orders
  workOrders: {
    list(filter?: WorkOrderFilter): Promise<WorkOrder[]>
    getById(id: number): Promise<WorkOrderWithItems | null>
    create(data: WorkOrderCreate): Promise<WorkOrder>
    update(id: number, data: WorkOrderUpdate): Promise<WorkOrder>
    delete(id: number): Promise<void>
    addLineItem(workOrderId: number, item: LineItemCreate): Promise<LineItem>
    updateLineItem(id: number, item: LineItemUpdate): Promise<LineItem>
    deleteLineItem(id: number): Promise<void>
  }
  
  // Payments
  payments: {
    listByWorkOrder(workOrderId: number): Promise<Payment[]>
    create(data: PaymentCreate): Promise<Payment>
    update(id: number, data: PaymentUpdate): Promise<Payment>
    delete(id: number): Promise<void>
  }
  
  // Settings
  settings: {
    getAll(): Promise<Settings>
    update(key: string, value: string): Promise<void>
  }
  
  // Backup
  backup: {
    exportManual(): Promise<string | null>  // returns path or null if cancelled
    restore(): Promise<boolean>  // returns success
  }
}
```

### Database Schema

```sql
-- Migration 001: Initial schema

CREATE TABLE customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  fiscal_code TEXT,
  notes TEXT,
  preferred_language TEXT DEFAULT 'it',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE vehicles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  license_plate TEXT UNIQUE NOT NULL,
  make TEXT,
  model TEXT NOT NULL,
  year INTEGER CHECK (year >= 1900 AND year <= strftime('%Y', 'now')),
  vin TEXT CHECK (length(vin) <= 17),
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

CREATE TABLE quotes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  quote_number TEXT UNIQUE NOT NULL,
  date TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'accepted', 'rejected', 'converted')),
  description TEXT,
  labor_hours REAL DEFAULT 0,
  hourly_rate REAL NOT NULL,
  parts_cost REAL DEFAULT 0,
  total_cost REAL DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE work_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  vehicle_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  quote_id INTEGER,
  order_number TEXT UNIQUE NOT NULL,
  date_in TEXT NOT NULL,
  date_out TEXT,
  mileage_in INTEGER,
  mileage_out INTEGER CHECK (mileage_out IS NULL OR mileage_out >= mileage_in),
  description TEXT,
  labor_hours REAL DEFAULT 0,
  hourly_rate REAL NOT NULL,
  parts_cost REAL DEFAULT 0,
  total_cost REAL DEFAULT 0,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (quote_id) REFERENCES quotes(id)
);

CREATE TABLE work_order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  work_order_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantity REAL NOT NULL CHECK (quantity > 0),
  unit_price REAL NOT NULL CHECK (unit_price >= 0),
  item_type TEXT NOT NULL CHECK (item_type IN ('parts', 'labor')),
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
);

CREATE TABLE payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  work_order_id INTEGER NOT NULL,
  amount REAL NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'transfer')),
  payment_date TEXT NOT NULL,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (work_order_id) REFERENCES work_orders(id) ON DELETE CASCADE
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Indexes
CREATE INDEX idx_vehicles_customer ON vehicles(customer_id);
CREATE INDEX idx_quotes_customer ON quotes(customer_id);
CREATE INDEX idx_quotes_vehicle ON quotes(vehicle_id);
CREATE INDEX idx_work_orders_customer ON work_orders(customer_id);
CREATE INDEX idx_work_orders_vehicle ON work_orders(vehicle_id);
CREATE INDEX idx_work_orders_date_in ON work_orders(date_in);
CREATE INDEX idx_payments_work_order ON payments(work_order_id);

-- Seed default settings
INSERT INTO settings (key, value) VALUES ('hourly_rate', '45.00');
INSERT INTO settings (key, value) VALUES ('default_language', 'it');
INSERT INTO settings (key, value) VALUES ('shop_name', '');
INSERT INTO settings (key, value) VALUES ('currency', 'EUR');
```

### Pinia Store Structure

```typescript
// stores/customers.ts
export const useCustomersStore = defineStore('customers', () => {
  const customers = ref<Customer[]>([])
  const loading = ref(false)
  
  async function fetch(filter?: { search?: string }) { ... }
  async function create(data: CustomerCreate) { ... }
  async function update(id: number, data: CustomerUpdate) { ... }
  async function remove(id: number) { ... }
  
  return { customers, loading, fetch, create, update, remove }
})

// Similar pattern for: vehicles, quotes, workOrders, payments, settings
```

## Routing

```typescript
const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', redirect: '/customers' },
      { path: 'customers', component: CustomerList },
      { path: 'customers/new', component: CustomerForm },
      { path: 'customers/:id', component: CustomerDetail },
      { path: 'customers/:id/edit', component: CustomerForm },
      
      { path: 'vehicles', component: VehicleList },
      { path: 'vehicles/new', component: VehicleForm, query: { customerId: Number } },
      { path: 'vehicles/:id', component: VehicleDetail },
      { path: 'vehicles/:id/edit', component: VehicleForm },
      { path: 'vehicles/:id/timeline', component: VehicleTimeline },
      
      { path: 'quotes', component: QuoteList },
      { path: 'quotes/new', component: QuoteForm },
      { path: 'quotes/:id', component: QuoteDetail },
      { path: 'quotes/:id/edit', component: QuoteForm },
      
      { path: 'work-orders', component: WorkOrderList },
      { path: 'work-orders/new', component: WorkOrderForm },
      { path: 'work-orders/:id', component: WorkOrderDetail },
      { path: 'work-orders/:id/edit', component: WorkOrderForm },
      
      { path: 'settings', component: Settings },
    ]
  }
]
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Repository methods, calculation logic, validation | Vitest with in-memory SQLite |
| Integration | IPC handlers, store actions | Vitest with mocked IPC bridge |
| E2E | Critical user flows (create customer → vehicle → quote → work order → payment) | Playwright with test DB |

## Migration / Rollout

Greenfield project. Initial migration creates schema + seeds settings. Future migrations use versioned SQL files (002_add_column.sql, etc.) executed on app startup.

## Open Questions

None. All requirements are clear from specs.
