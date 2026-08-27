-- Dual pricing & VAT foundation migration
-- Applies: quote_items table, dual-price columns, VAT snapshot, profit visibility

BEGIN;

-- Quote line items (mirrors work_order_items with dual pricing)
CREATE TABLE IF NOT EXISTS quote_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quote_id INTEGER NOT NULL,
  description TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,
  customer_price REAL NOT NULL DEFAULT 0,
  workshop_price REAL NOT NULL DEFAULT 0,
  item_type TEXT NOT NULL DEFAULT 'parts',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (quote_id) REFERENCES quotes(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quote_items(quote_id);

-- Add dual-price columns to work order items and backfill from legacy unit_price
ALTER TABLE work_order_items ADD COLUMN customer_price REAL NOT NULL DEFAULT 0;
ALTER TABLE work_order_items ADD COLUMN workshop_price REAL NOT NULL DEFAULT 0;

UPDATE work_order_items
SET customer_price = unit_price,
    workshop_price = 0
WHERE unit_price IS NOT NULL;

ALTER TABLE work_order_items DROP COLUMN unit_price;

-- Add VAT rate and dual totals to quotes
ALTER TABLE quotes ADD COLUMN vat_rate REAL NOT NULL DEFAULT 0.21;
ALTER TABLE quotes ADD COLUMN customer_total REAL NOT NULL DEFAULT 0;
ALTER TABLE quotes ADD COLUMN workshop_total REAL NOT NULL DEFAULT 0;

-- Migrate existing quotes: create one synthetic parts line per quote from parts_cost
INSERT INTO quote_items (quote_id, description, quantity, customer_price, workshop_price, item_type)
SELECT id, 'Parts', 1, parts_cost, 0, 'parts'
FROM quotes
WHERE parts_cost > 0;

-- Compute quote totals after line items exist
UPDATE quotes
SET customer_total = ROUND((
  (labor_hours * hourly_rate) +
  COALESCE((SELECT SUM(quantity * customer_price) FROM quote_items WHERE quote_items.quote_id = quotes.id), 0)
) * (1 + vat_rate), 2),
    workshop_total = ROUND((
  COALESCE((SELECT SUM(quantity * workshop_price) FROM quote_items WHERE quote_items.quote_id = quotes.id), 0)
) * (1 + vat_rate), 2);

ALTER TABLE quotes DROP COLUMN parts_cost;
ALTER TABLE quotes DROP COLUMN total_cost;

-- Add VAT rate and dual totals to work orders
ALTER TABLE work_orders ADD COLUMN vat_rate REAL NOT NULL DEFAULT 0.21;
ALTER TABLE work_orders ADD COLUMN customer_total REAL NOT NULL DEFAULT 0;
ALTER TABLE work_orders ADD COLUMN workshop_total REAL NOT NULL DEFAULT 0;

UPDATE work_orders
SET customer_total = ROUND((
  (labor_hours * hourly_rate) +
  COALESCE((SELECT SUM(quantity * customer_price) FROM work_order_items WHERE work_order_items.work_order_id = work_orders.id AND item_type = 'parts'), 0)
) * (1 + vat_rate), 2),
    workshop_total = ROUND((
  COALESCE((SELECT SUM(quantity * workshop_price) FROM work_order_items WHERE work_order_items.work_order_id = work_orders.id AND item_type = 'parts'), 0)
) * (1 + vat_rate), 2);

ALTER TABLE work_orders DROP COLUMN parts_cost;
ALTER TABLE work_orders DROP COLUMN total_cost;

-- Configurable VAT rate setting (default 21%)
INSERT OR IGNORE INTO settings (key, value) VALUES ('vat_rate', '0.21');

COMMIT;
