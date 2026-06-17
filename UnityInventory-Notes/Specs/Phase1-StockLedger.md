# Phase 1: Stock Ledger API & UI

## Goal
Complete Phase 1 by exposing the newly created `StockLedgerService` via REST APIs and integrating it into the Next.js frontend portal.

## Background
The backend currently has `StockLedgerService.cs` implemented with methods for `RecordReceiptAsync`, `RecordShipmentAsync`, `ApplyLandedCostAsync`, and `GetCurrentValuationAsync`. The database tables `TblStockLedger` and `TblStockLedgerAllocations` exist. However, there are no endpoints to call these methods, and the frontend is entirely unaware of the Stock Ledger.

## Requirements
1. **Backend API**: 
   - A new `StockLedgerController` must be added.
   - It should expose endpoints for Receipt, Shipment, Landed Cost, and Valuation.
   - It must utilize the `[Authorize]` and `[Permission]` filters as per architecture rules.
   - Manual `UpdateStock` in `InventoriesController` should be marked `[Obsolete]` or disabled.

2. **Frontend Service API**:
   - `src/services/stockLedger.ts` should be created to mirror these endpoints using Axios.

3. **Frontend UI**:
   - A new sub-page `/inventory/[id]/ledger` to show the ledger history.
   - Modals to Record Receipt, Record Shipment, and Apply Landed Cost.

## Tasks
- [ ] Task 1: Backend API Implementation (See `Tasks/Task-01-Backend-API.md`)
- [ ] Task 2: Frontend API Integration (See `Tasks/Task-02-Frontend-API.md`)
- [ ] Task 3: Frontend UI Components (See `Tasks/Task-03-Frontend-UI.md`)

