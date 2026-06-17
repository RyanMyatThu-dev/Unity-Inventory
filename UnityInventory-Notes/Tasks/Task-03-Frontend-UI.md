# Task 03: Frontend UI Components

## Objective
Create the Ledger history view and interactive modals for the Stock Ledger.

## Target Files
- `Unity_Inventory.Frontend/src/app/inventory/[id]/ledger/page.tsx` (New)
- `Unity_Inventory.Frontend/src/app/inventory/[id]/ledger/components/RecordReceiptModal.tsx` (New)
- `Unity_Inventory.Frontend/src/app/inventory/[id]/ledger/components/RecordShipmentModal.tsx` (New)
- `Unity_Inventory.Frontend/src/app/inventory/[id]/ledger/components/ApplyLandedCostModal.tsx` (New)

## Requirements
1. **Ledger Page**:
   - Create a Next.js App Router page at `src/app/inventory/[id]/ledger/page.tsx`. It will receive `params: { id: string }`.
   - The page should use `'use client'`.
   - Fetch the ledger history using `getLedgerHistory(Number(id), { pageNumber: 1, pageSize: 50 })` from `src/services/stockLedger.ts`.
   - Display a table of `TblStockLedger` entries with columns: Date, Transaction Type, Account, Quantity, Unit Cost, Total Value, Reference. Use Tailwind CSS v4 styling. Use Lucide icons (e.g. `lucide-react`).
   
2. **Action Buttons**:
   - Add buttons above the table to "Record Receipt", "Record Shipment", and "Apply Landed Cost".
   - Clicking these opens their respective Modals.
   - You can place the modals in the same file or in the `components/` subfolder.
   
3. **Modals**:
   - Create React components for each action. They should accept `isOpen`, `onClose`, and `inventoryId`.
   - They should use the `stockLedger.ts` service functions (`recordReceipt`, `recordShipment`, `applyLandedCost`) to post data.
   - Show success toasts (`toast.success` from `sonner`) on completion and trigger a data refresh.

4. **Link to Ledger**:
   - Since we shouldn't heavily refactor `src/app/inventory/page.tsx` to add a massive button right now, just ensure the ledger page is functionally complete and accessible via URL. (Optional: If you can safely add a link in `src/app/inventory/page.tsx` inside the `ProductDetailModal` near the Stock Management section, you may do so. Example: a `<Link href={\`/inventory/${product.id}/ledger\`}>View Ledger</Link>`).
