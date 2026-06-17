# Task 02: Frontend API Integration

## Objective
Create the client-side API functions to call the newly created `StockLedgerController`.

## Target Files
- `Unity_Inventory.Frontend/src/services/stockLedger.ts` (New)

## Requirements
1. **Create API File**:
   - Create `stockLedger.ts`.
   - Import the configured axios instance (`import { api } from './api';`).
   - Define TypeScript interfaces mapping to the backend requests:
     - `PostReceiptRequest`
     - `PostShipmentRequest`
     - `ApplyLandedCostRequest`
   - Create and export async functions:
     - `recordReceipt(data: PostReceiptRequest)` -> `POST /api/stockledger/receipt`
     - `recordShipment(data: PostShipmentRequest)` -> `POST /api/stockledger/shipment`
     - `applyLandedCost(data: ApplyLandedCostRequest)` -> `POST /api/stockledger/landed-cost`
     - `getValuation(inventoryId: number, method: 'FIFO' | 'WAC')` -> `GET /api/stockledger/valuation/${inventoryId}?method=${method}`
   - Ensure these functions handle standard `Result<T>` wrapping as defined in `api.ts` or as expected by the frontend pattern.

2. **Verify**:
   - Run `npx tsc --noEmit` to verify type safety.
