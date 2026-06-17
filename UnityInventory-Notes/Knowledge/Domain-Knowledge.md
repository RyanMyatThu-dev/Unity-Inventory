# Domain Knowledge Repository

This document accumulates core inventory management, logistics, accounting, and codebase-specific domain knowledge. It serves as our shared context guide to ensure features align with industry standards.

---

## 📈 1. Inventory Valuation Methods
How inventory cost is tracked directly affects profitability reports, balance sheets, and tax liability.

### A. FIFO (First-In, First-Out)
- **Concept**: Assumes the oldest inventory items are sold first.
- **Tax/Accounting Impact**: In times of inflation, FIFO results in lower Cost of Goods Sold (COGS) and higher net income because older, cheaper items are recorded as sold first.
- **Implementation Note**: Requires tracking stock entries in batches with their incoming costs, rather than a single flat product unit price.

### B. LIFO (Last-In, First-Out)
- **Concept**: Assumes the newest inventory items are sold first.
- **Tax/Accounting Impact**: Results in higher COGS and lower net income during inflation, lowering tax liability. (Prohibited under IFRS, allowed under US GAAP).
- **Implementation Note**: Needs stack-based batch resolution on sales decrement.

### C. Weighted Average Cost (WAC)
- **Concept**: Divides the total cost of goods available for sale by the total units in stock.
- **Formula**: `New Average Cost = (Old Total Value + New Purchase Value) / (Old Quantity + New Quantity)`
- **Implementation Note**: Executed dynamically on incoming stock updates (seeders/purchases).

---

## 🏷️ 2. SKUs & Barcoding Standards
Products require identifiers that can be read digitally by scanners or entered by hand.

- **SKU (Stock Keeping Unit)**: A merchant-specific alphanumeric code (e.g., `APP-12-RED-XL`). Unlike UPCs, SKUs are internal and customizable.
- **UPC (Universal Product Code)**: A standard 12-digit barcode used globally for tracking trade items in stores.
- **EAN (European Article Number)**: A 13-digit standard barcode used globally (supersets UPC).
- **Check Digit Validation**: Standard Modulo-10 algorithms should validate scanned barcodes before querying the database to prevent junk queries.

---

## 📊 3. Financial & Operational Metrics

### A. Inventory Turnover Ratio
Measures how many times a company's inventory is sold and replaced over a period.
- **Formula**: `Turnover = Cost of Goods Sold (COGS) / Average Inventory`
- **Utility**: Higher turnover indicates strong sales or efficient stock levels; low turnover indicates overstocking.

### B. Reorder Point (ROP) & Safety Stock
Triggers notifications when item stocks drop below thresholds.
- **Formula**: `Reorder Point = (Lead Time * Daily Average Sales) + Safety Stock`
- **Safety Stock**: `(Max Daily Sales * Max Lead Time) - (Avg Daily Sales * Avg Lead Time)`

---

## 💻 4. System Engineering Insights (Local Codebase)

### A. PostgreSQL Timestamp Alignment
- PostgreSQL stores timestamps in UTC or without timezone. Entity Framework Core compares local dates.
- **Fix**: In our codebase, we globally configured Npgsql's legacy timestamp behavior:
  ```csharp
  AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
  ```

### B. Hangfire Database Storage
- Hangfire uses our PostgreSQL instance to store queues, locks, and schedules. It creates dynamic tables starting with `hangfire.` inside the database schema.
- **Precaution**: Do not wipe these tables or interrupt the schema migration during runtime.

---

## 📖 Glossary of Terms
- **Safety Stock**: Buffer inventory held to prevent stockouts caused by demand/supply fluctuations.
- **Stockout**: A situation where customer demand cannot be fulfilled because inventory is completely depleted.
- **Lead Time**: The latency between placing an order with a supplier and receiving the items.
- **Voucher**: A detailed transactional entry representing sales reports or invoices.
