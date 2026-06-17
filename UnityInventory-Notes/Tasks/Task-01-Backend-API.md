# Task 01: Backend API Implementation

## Objective
Create the REST controller to expose the `IStockLedgerService` capabilities to the frontend clients. Add history fetching.

## Target Files
- `Unity_Inventory.Domain/Features/Inventories/IStockLedgerService.cs` (Modify)
- `Unity_Inventory.Domain/Features/Inventories/StockLedgerService.cs` (Modify)
- `Unity_Inventory.Api/Controllers/StockLedgerController.cs` (New)
- `Unity_Inventory.Api/Controllers/InventoriesController.cs` (Modify)

## Requirements
1. **Add `GetLedgerHistoryAsync`**:
   - In `IStockLedgerService` and `StockLedgerService`, add:
     `Task<PagedResult<StockLedgerHistoryDTO>> GetLedgerHistoryAsync(int businessId, int inventoryId, PaginationRequest request);`
   - Use `_db.TblStockLedgers` filtered by BusinessId, InventoryId, and `DeleteFlag == false`. Order by CreatedAt descending.
   - Return a `PagedResult` mapping to a new `StockLedgerHistoryDTO` (LedgerId, LedgerAccount, TransactionType, ReferenceDocument, Quantity, UnitCost, TotalValue, CreatedAt). Add this DTO to `Unity_Inventory.Domain/Features/Inventories/Models/StockLedgerDTOs.cs`.

2. **Create `StockLedgerController`**:
   - Inherit from `BaseController` (or standard `ControllerBase` if it doesn't exist, use `[ApiController]` and `[Route("api/[controller]")]`).
   - Extract `BusinessId` securely (usually `int businessId = int.Parse(User.FindFirst("BusinessId")?.Value ?? "0");` or whatever standard method).
   - Add POST endpoints: `/api/stockledger/receipt`, `/api/stockledger/shipment`, `/api/stockledger/landed-cost` (all require `[Permission("inventory", "edit")]`).
   - Add GET endpoints: `/api/stockledger/valuation/{inventoryId}` and `/api/stockledger/history/{inventoryId}` (require `[Permission("inventory", "view")]`).

3. **Deprecate Manual Stock Update**:
   - In `InventoriesController.cs`, locate `UpdateStock`.
   - Add `[Obsolete("Use StockLedger endpoints for all stock changes. This endpoint will be removed in Phase 2.")]`.

4. **Verify**:
   - Ensure `dotnet build Unity_Inventory.Api/Unity_Inventory.Api.csproj` compiles.
