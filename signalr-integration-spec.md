# SignalR Integration Specification: Realtime Sales & Stock Updates

> **Last updated:** June 9, 2026
> **Status:** Refined — scope narrowed to sales summary KPIs + line chart only

---

## 1. Overview

Add real-time push notifications via **SignalR** so that when an admin creates a sale, the sales summary page and inventory page update immediately without polling. The hub already exists as a bare class; this spec covers the full wiring.

---

## 2. Architecture Diagram (Conceptual)

```
Admin (browser)                   .NET API                         Other Browsers
      │                              │                                   │
      │  POST /api/sales/reports     │                                   │
      │ ──────────────────────────►  │                                   │
      │                              │  SalesService.CreateReportAsync() │
      │                              │  ├─ saves to DB                   │
      │                              │  ├─ calls ISummaryService          │
      │                              │  │   .GetSalesSummaryAsync(month)  │
      │                              │  └─ IHubContext<SummaryHub>       │
      │                              │  .SendAsync("SummaryDataUpdated") │
      │                              │       with { SaleReport,           │
      │                              │                UpdatedSummary }    │
      │                              │             │                     │
      │                              │     ┌───────┴────────┐            │
      │                              │     │  SignalR Hub   │            │
      │  ◄── 201 Created ────────────│     │  /hubs/summary │            │
      │                              │     └───────┬────────┘            │
      │                              │             │                     │
      │                              │             │ "SummaryDataUpdated" │
      │                              │             │ { saleReport,        │
      │                              │             │   updatedSummary }   │
      │                              │             │────────────────────►│
      │                              │             │                     │
      │                              │             │  ◄── Client updates  │
      │                              │             │  KPI cards + line    │
      │                              │             │  chart + rankings    │
      │                              │             │  from pushed data    │
```

---

## 3. Existing State (No Changes Needed)

| Component | Status |
|---|---|
| `builder.Services.AddSignalR()` in `Program.cs` | ✅ Already registered |
| `app.MapHub<SummaryHub>("/hubs/summary")` in `Program.cs` | ✅ Already mapped |
| CORS with `AllowCredentials()` in `Program.cs` | ✅ Already configured |
| `SummaryHub.cs` class with `[Authorize]` attribute | ✅ Already exists (bare) |
| `@microsoft/signalr` npm package | ❌ Not installed yet |
| JWT query string token extraction | ❌ Not implemented |

---

## 4. Hub Enhancements

### 4.1 SummaryHub.cs — Add Business Group Management

The hub needs two things:
- **`JoinBusinessGroup(int businessId)`** — called by the client after connecting, adds the connection to a group scoped to that business
- **`OnConnectedAsync`** / **`OnDisconnectedAsync`** — for logging/tracking

Groups are named `"business-{businessId}"`. This ensures users only receive events for their active business.

```csharp
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace Unity_Inventory.Domain.Hubs
{
    [Authorize]
    public class SummaryHub : Hub
    {
        public async Task JoinBusinessGroup(int businessId)
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"business-{businessId}");
        }

        public async Task LeaveBusinessGroup(int businessId)
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"business-{businessId}");
        }

        public override async Task OnConnectedAsync()
        {
            // Optional: logging or connection tracking
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            // Optional: cleanup
            await base.OnDisconnectedAsync(exception);
        }
    }
}
```

### 4.2 SignalR Events (Event Names)

The hub will broadcast these events from the server:

| Event Name | Payload | Triggered By |
|---|---|---|
| `"SummaryDataUpdated"` | `{ SaleReport: ReportDTO, UpdatedSummary: SalesSummaryDto }` | After `SalesService.CreateReportAsync` succeeds — the server recalculates the **current MONTHLY** summary on-the-fly and pushes both the new report and the updated summary |

**Note:** No events for:
- Sale deletions (not allowed in business logic)
- Summary generation via Hangfire (manual only; not included in scope)
- Customer or category changes
- Standalone stock updates (scope narrowed to sales summary KPIs + line chart only)

---

## 5. Backend Integration: SalesService

### 5.1 Inject IHubContext<SummaryHub>

Inject `IHubContext<SummaryHub>` into `SalesService` via constructor DI.

```csharp
private readonly IMSDbContext _db;
private readonly IHubContext<SummaryHub> _hubContext;

public SalesService(IMSDbContext db, IHubContext<SummaryHub> hubContext)
{
    _db = db;
    _hubContext = hubContext;
}
```

### 5.2 After Sale Creation: Recalculate Summary + Push

This is the core logic. After the sale transaction commits in `CreateReportAsync`, the server must:

1. Fetch the full `ReportDTO` (already exists as `GetReportByIdAsync`)
2. Calculate or retrieve the **current MONTHLY** `SalesSummaryDto` via `ISummaryService.GetSalesSummaryAsync`
3. Push both in a single `"SummaryDataUpdated"` event

```csharp
// After successful commit (inside CreateReportAsync):

// 1. Fetch the full report
var reportDto = (await GetReportByIdAsync(report.ReportId)).Data;

// 2. Recalculate the current month summary
var today = DateOnly.FromDateTime(DateTime.Now);
var monthStart = new DateOnly(today.Year, today.Month, 1);
var monthEnd = monthStart.AddMonths(1).AddDays(-1);

var summaryResult = await _summaryService.GetSalesSummaryAsync(
    request.BusinessId, "MONTHLY", monthStart, monthEnd);

// 3. Push both in one event
await _hubContext.Clients
    .Group($"business-{request.BusinessId}")
    .SendAsync("SummaryDataUpdated", new
    {
        SaleReport = reportDto,
        UpdatedSummary = summaryResult.IsSuccess ? summaryResult.Data : null
    });
```

### 5.3 Dependencies

`SalesService` now requires two additional dependencies injected via constructor:
- `IHubContext<SummaryHub>` — to push events
- `ISummaryService` — to recalculate the monthly summary

Both are already registered in the DI container. `IHubContext<T>` is auto-registered by `AddSignalR()`, and `ISummaryService`/`SummaryService` is already registered in `FeaturesManager.cs`.

### 5.4 No New DTO Needed

Since we're pushing the existing `ReportDTO` and `SalesSummaryDto`, no new DTOs need to be created for the SignalR payload. The anonymous object pattern (or a simple wrapper class) works fine.

**Stock updates are not included in this push.** The scope is narrowed to the sales summary KPIs and line chart only. Stock push can be added later if needed.

---

## 6. JWT Authentication for SignalR (TokenValidation Middleware)

### 6.1 Problem

SignalR WebSocket connections cannot set custom HTTP headers (like `Authorization: Bearer ...`). The browser's `@microsoft/signalr` SDK sends the token as a **query string parameter** named `access_token`.

The current `TokenValidation` middleware only reads from `context.Request.Headers["Authorization"]`.

### 6.2 Solution

Modify `TokenValidation.cs` to also read the `access_token` query parameter for requests whose path starts with `/hubs/`:

```csharp
public async Task InvokeAsync(HttpContext context)
{
    var path = context.Request.Path.Value?.ToLower();
    
    // Skip auth for login/register endpoints
    if (path != null && (path.Contains("/api/auth/login") || path.Contains("/api/auth/register")))
    {
        await _next(context);
        return;
    }

    // For SignalR connections, read token from query string
    if (path != null && path.StartsWith("/hubs/"))
    {
        token = context.Request.Query["access_token"].FirstOrDefault();
    }
    else
    {
        // Regular HTTP: read from Authorization header
        token = context.Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
    }
    
    // ... rest of existing validation logic
}
```

### 6.3 Middleware Order

The middleware pipeline should remain:

```
ExceptionHandlingMiddleware
  → MapHub<SummaryHub> / Redirect / CORS
  → UseAuthentication()
  → TokenValidation (reads header OR query string)
  → UseAuthorization()
  → MapControllers()
```

**Important:** `app.MapHub<SummaryHub>()` must be placed **before** `app.UseAuthentication()` so the middleware pipeline captures SignalR requests. This is already the case in `Program.cs`.

---

## 7. Frontend Integration

### 7.1 Install Package

```bash
npm install @microsoft/signalr
```

### 7.2 New React Context: SignalRContext

Create `Unity_Inventory.Frontend/src/context/SignalRContext.tsx` — a global provider that:

- Creates a single `HubConnection` instance at app root
- Uses `withAutomaticReconnect()` for resilience
- Passes the JWT via `accessTokenFactory`
- Calls `JoinBusinessGroup` after connecting
- Exposes connection state and event subscriptions

**Key design decisions:**
- Global scope (not page-scoped) so it persists across navigations
- Reconnects automatically with exponential backoff
- Subscribes to the `"SummaryDataUpdated"` event
- Wraps events as React callbacks consumers can register

```typescript
// Conceptual API:
const { connectionState, lastSummaryUpdate } = useSignalR();

// lastSummaryUpdate contains:
// {
//   saleReport: ReportDTO,
//   updatedSummary: SalesSummaryDto  // fully recalculated with new KPIs + trend data
// }
```

### 7.3 Connection Configuration

```typescript
const connection = new signalR.HubConnectionBuilder()
  .withUrl(`${API_BASE_URL.replace('/api', '')}/hubs/summary`, {
    accessTokenFactory: () => localStorage.getItem('accessToken') ?? ''
  })
  .withAutomaticReconnect([0, 2000, 5000, 10000, 30000]) // Retry intervals (ms)
  .build();
```

### 7.4 Event Handlers

The only event the frontend subscribes to is `"SummaryDataUpdated"`:

```typescript
connection.on('SummaryDataUpdated', (data: {
  saleReport: ReportDTO;
  updatedSummary: SalesSummaryDto;
}) => {
  // 1. Sales summary page: replace the entire `activeSummary` state
  //    with data.updatedSummary — this updates all KPI cards AND
  //    the line chart (trend data), plus customer/product rankings
  //
  // 2. Sales page: prepend data.saleReport to the reports list
  //
  // 3. No additional API calls needed
});
```

**The data is fully calculated server-side before pushing**, so the client does NOT need to call any additional API endpoint. The `updatedSummary` is a complete `SalesSummaryDto` with:
- All 4 KPI cards (revenue, avg order value, order volume, unique customers)
- Sales trend telemetry (line chart data)
- Customer & product rankings (pie/bar charts)

### 7.5 Lifecycle

| Event | Action |
|---|---|
| App mounts | Create connection, start, join business group |
| User switches business | Call `LeaveBusinessGroup(oldId)` then `JoinBusinessGroup(newId)` |
| Connection drops | Automatic retry with backoff (built-in) |
| Token expires/refreshed | `accessTokenFactory` is called on reconnect, gets fresh token |
| App unmounts (rare in SPA) | Stop connection, clean up |

### 7.6 Pages That Respond to Events

| Page | Event | Reaction |
|---|---|---|
| `/sales/summaries` | `SummaryDataUpdated` | Replace entire `activeSummary` state with `data.updatedSummary`. All KPIs + line chart + rankings update immediately. |
| `/sales` | `SummaryDataUpdated` | Prepend `data.saleReport` to the reports list (if it matches current filters) |

**`/inventory` page is NOT updated** — stock push is out of scope for this iteration.

---

## 8. Group Membership Strategy

- Each connection joins a group named `"business-{businessId}"`
- The `businessId` is extracted from the JWT claim (same `GetBusinessId()` pattern used in controllers)
- On business switch, the client explicitly calls `LeaveBusinessGroup(oldId)` and `JoinBusinessGroup(newId)`

---

## 9. Error Handling & Edge Cases

| Scenario | Handling |
|---|---|
| Connection fails to start | Log error, show subtle indicator in UI (e.g., small disconnected badge) |
| Token expired mid-connection | `accessTokenFactory` returns expired token → connection drops → `withAutomaticReconnect` retries → `accessTokenFactory` called again → fresh token from `localStorage` |
| Server restart | All connections drop → clients auto-reconnect with backoff |
| Multiple tabs | Each tab has its own connection; all receive events independently |
| Hub throws exception | Should not crash the service; wrap hub pushes in try-catch in `SalesService` |
| Race condition: navigation before push arrives | Connection is global; push arrives regardless of which page is visible; component checks if it should process the event based on current route |

---

## 10. Files to Create / Modify

### Create

| File | Purpose |
|---|---|
| `Unity_Inventory.Frontend/src/context/SignalRContext.tsx` | React context + provider for SignalR connection lifecycle |
| `Unity_Inventory.Domain/Features/Sales/Models/StockUpdateDto.cs` | DTO for stock update push payload |

### Modify

| File | Change |
|---|---|
| `Unity_Inventory.Domain/Hubs/SummaryHub.cs` | Add `JoinBusinessGroup` and `LeaveBusinessGroup` methods |
| `Unity_Inventory.Domain/Features/Sales/SalesService.cs` | Inject `IHubContext<SummaryHub>`, push after successful sale creation |
| `Unity_Inventory.Domain/Features/Sales/ISalesService.cs` | No changes needed (interface stays the same) |
| `Unity_Inventory.Shared/Middlewares/TokenValidation.cs` | Add query string token extraction for `/hubs/` paths |
| `Unity_Inventory.Frontend/src/app/layout.tsx` | Wrap root with `SignalRProvider` |
| `Unity_Inventory.Frontend/src/app/sales/summaries/page.tsx` | Subscribe to `SaleCreated` and `StockUpdated` events via context |
| `Unity_Inventory.Frontend/src/app/inventory/page.tsx` | Subscribe to `StockUpdated` events |
| `Unity_Inventory.Frontend/src/app/sales/page.tsx` | Subscribe to `SaleCreated` to prepend new reports |
| `Unity_Inventory.Frontend/package.json` | Add `@microsoft/signalr` dependency |

### No Changes

| File | Reason |
|---|---|
| `Unity_Inventory.Api/Program.cs` | `AddSignalR()`, `MapHub<>`, and CORS already configured |
| `Unity_Inventory.Api/Controllers/SalesController.cs` | Push happens in service layer, controller unchanged |
| `Unity_Inventory.Domain/Features/FeaturesManager.cs` | `IHubContext` is auto-registered by SignalR |
| `Unity_Inventory.Domain/Features/Summary/SummaryService.cs` | Not in scope for push events |

---

## 11. Implementation Order

1. Create `StockUpdateDto.cs` model
2. Update `SummaryHub.cs` with group management methods
3. Update `TokenValidation.cs` to handle query string tokens for `/hubs/` paths
4. Install `@microsoft/signalr` and create `SignalRContext.tsx`
5. Wire `SignalRProvider` into `layout.tsx`
6. Inject `IHubContext<SummaryHub>` into `SalesService` and implement pushes
7. Subscribe to events in `sales/summaries/page.tsx`
8. Subscribe to events in `inventory/page.tsx`
9. Subscribe to events in `sales/page.tsx`

---

## 12. Open Questions (Resolved via Interview)

| Question | Decision |
|---|---|
| What payload to push? | Full `ReportDTO` data (fetched server-side before push) |
| Where to trigger push? | Inside `SalesService`, not the controller |
| Push on sale delete? | No — deletions are not allowed |
| Push on summary generation? | No — only on sale creation |
| Push stock updates too? | Yes — push `StockUpdateDto` for each affected inventory item |
| JWT auth for SignalR? | Handle inside existing `TokenValidation` middleware by reading `access_token` query string |
| Frontend connection scope? | Global (app-wide context provider) |
| Reconnection strategy? | `withAutomaticReconnect()` with default backoff intervals |
| How to avoid double-fetching? | Server fetches full data and pushes it; client uses the pushed data directly |

---

## 13. Testing Considerations

- Verify SignalR connection succeeds with JWT passed via query string
- Verify business group isolation (user A in business 1 does not receive events from business 2)
- Verify reconnection after server restart
- Verify stock updates reflect correct remaining quantities
- Verify the sales summary page KPIs update correctly when a sale is made within the current summary period
- Verify the inventory page stock levels update in real-time
