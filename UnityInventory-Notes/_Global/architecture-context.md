# Architecture Context

This document provides a comprehensive overview of the system architecture, component boundaries, and core operational mechanics of the **Unity Inventory Management System (IMS)**.

---

## 1. High-Level System Architecture

The project implements a modern multi-tenant architecture consisting of a distributed REST API backend and two distinct frontend interfaces (a React Single Page Application and an MVC companion app).

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND BOUNDARY                           │
│                                                                      │
│  ┌─────────────────────────┐        ┌────────────────────────────┐  │
│  │  Unity_Inventory.Frontend │       │  Unity_Inventory.WebApp    │  │
│  │  (Next.js 16 + React 19) │       │  (ASP.NET Core 8 MVC)      │  │
│  │  Tailwind v4, Recharts   │       │  Rotativa (PDF),          │  │
│  │  Dark/Light mode         │       │  Tailwind CSS, jQuery      │  │
│  └───────────┬─────────────┘        └─────────────┬──────────────┘  │
│              │ HTTP (JWT Bearer)                   │ (Future)        │
└──────────────┼────────────────────────────────────┼─────────────────┘
               ▼                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY                                 │
│  Unity_Inventory.Api (ASP.NET Core 8 Web API)                       │
│  - JWT Bearer Auth   - Serilog Logging                              │
│  - CORS (localhost:3000)   - Swagger + Scalar API Reference         │
│  - Custom TokenValidation Middleware                                 │
│  - Custom PermissionAttribute (TypeFilter)                          │
├─────────────────────────────────────────────────────────────────────┤
│                    BUSINESS LOGIC & DOMAIN                           │
│  Unity_Inventory.Domain (11 feature services)                       │
│  - AuthService / TokenService / UserService                         │
│  - BusinessService / PermissionService                              │
│  - SalesService / DashboardService / SearchService                  │
│  - CustomerService / CustomerPriceService                           │
│  - InventoryService / CategoryService / SummaryService              │
│  - PhotoUploadService (Cloudinary)                                  │
├─────────────────────────────────────────────────────────────────────┤
│                    DATA ACCESS LAYER                                │
│  Unity_Inventory.Database (EF Core 8, DbContext, 14 entity types)   │
│  SQL Server (local dev: IMS_NEW)                                    │
├─────────────────────────────────────────────────────────────────────┤
│                    SHARED CONTRACTS                                 │
│  Unity_Inventory.Shared                                              │
│  - Result<T> / PagedResult<T> / Pagination                          │
│  - PaginationRequest                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 2. Layer & Component Boundaries

### A. Presentation Layer (`Unity_Inventory.Api`)
- **Controllers**: Expose uniform REST endpoints under the `api/` route pattern. All controllers (except parts of `AuthController` and `UserController`) require JWT authentication.
- **Filters**: Custom `PermissionAttribute` (using `PermissionFilter` as an `IAsyncAuthorizationFilter`) intercepts endpoint calls to perform fine-grained database-driven authorization checks.
- **Middlewares**: Custom `TokenValidation` middleware executes verification steps on authenticated claims.

### B. Business Logic Layer (`Unity_Inventory.Domain`)
- **Feature Services**: Standardized on constructor dependency injection. Features are structured into independent folders under `Features/` (e.g., `Authentication`, `Sales`, `Dashboard`).
- **Registration**: All services and ORM references are bootstrapped via the static `FeaturesManager.AddDomain` extensions, keeping the host project (`Api`) clean and decoupled.

### C. Data Access Layer (`Unity_Inventory.Database`)
- **Context & Mapping**: Managed entirely through Entity Framework Core 8. Explicit entity configurations (indexes, keys, relationships, concurrency tokens) are mapped using fluent configuration inside `IMSDbContext.OnModelCreating.cs`.
- **Authoritative Schema**: The EF configurations are the system's "Source of Truth". Legacy scripts such as `dbscript.sql` are considered historic snapshots.

### D. Shared Contracts Layer (`Unity_Inventory.Shared`)
- **Contracts**: Contains generic `Result<T>` and `PagedResult<T>` wrapper objects used by all services to communicate execution status, data payload, messages, and pagination metadata.
- **Decoupled**: Contains zero external runtime dependencies except standard ASP.NET Core abstractions, ensuring fast compilation.

---

## 3. Core System Workflows

### A. Authentication & Token Management

```
Login Request → AuthService.LoginAsync()
  ├─ Verify email/password (BCrypt)
  ├─ TokenService.GenerateAccessTokenAsync(user, null, null)
  │    └─ JWT claims: NameIdentifier, Name, Email, AccountType
  ├─ GenerateRefreshToken() → SHA256 hash → Tbl_UserTokens
  ├─ Set HttpOnly cookie for refreshToken
  └─ Return TokenResponse { AccessToken, RefreshToken, User, Businesses }
```

1. **Initial Authentication**: The login credentials are verified using BCrypt. An "ambient" token is created containing core user claims, but no business context.
2. **Business Switch**: When switching to a business workspace (via `/api/business/switch-business/{businessId}`), `VerifyBusinessAccessAsync` verifies the membership role. A new **business-scoped JWT** is issued, appending `BusinessId`, `Role`, and pre-resolved `Permission` claims, reducing authorization overhead on later requests.
3. **Token Rotation**: Hashed refresh tokens are persisted in `Tbl_UserTokens` with an sliding expiry window and hard revocation flags, rotating on every refresh event.

### B. Dynamic Customer Pricing
The price of a product during sale generation is dynamically computed:
1. **Direct Override**: The system queries `Tbl_CustomerPrices` for a matching `(BusinessId, CustomerId, InventoryId)` record.
2. **Fallback**: If no custom price is configured, the system falls back to the catalog's base list price defined on `Tbl_Inventories`.

### C. Precedence-Based Permission Resolution
Permissions are dynamically evaluated on a hierarchy configured in `Tbl_RolePermissions`:

```
                            [Permission Request]
                                     │
                                     ▼
                      Query TblRolePermissions for:
                   BusinessId, MenuCode, and ActionCode
                     Where: UserId OR RoleName match
                                     │
                                     ▼
                      Sort Rows by UserId.HasValue:
                     (User-specific overrides first)
                                     │
                                     ▼
                            Evaluate First Row:
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
     [IsRevoked == true]                                [IsRevoked == false]
           │                                                   │
           ▼                                                   ▼
     HARD DENIAL                                        Allow Access if
  (Overrides all roles)                               IsAllowed == true
```

1. **Query**: The service fetches any permission rows matching the resource codes, scoped to either the User specifically OR the User's current Role in the business.
2. **Sorting**: It sorts the matching records by `UserId.HasValue DESC`, guaranteeing that **user-specific overrides take absolute precedence over generic role grants**.
3. **Denial**: If the matching override or role contains `IsRevoked == true`, it forces an immediate rejection, bypassing any generic allowances.

### D. Transactional Sales Processing
Creating a sales report (`CreateReportAsync`) executes in an isolated transaction:
1. It validates that the Customer exists and is active.
2. It generates `TblReport` (header) and inserts matching `TblVoucher` lines.
3. It **decrements stock balances** in `Tbl_InventorySummary` for each item.
4. It **increments customer lifetime spending and transaction logs** in `Tbl_CustomerSummary`.
5. It commits only when all updates succeed, preventing orphaned vouchers or stock counts.
6. **Real-Time Broadcast**: After commit, it extracts the latest analytical snapshots (Daily, Weekly, Monthly, Yearly summaries and live Dashboard KPI data) and pushes them simultaneously via `SaleSummaryHub` and `DashboardHub` to active WebSocket clients grouped by `BusinessId`.

### E. Real-Time Broadcasting (SignalR)
WebSockets are integrated for immediate UI hydration without polling:
1. **Connection Negotiation**: Frontend (Next.js) requests `/hubs/salesummary/negotiate`. Since standard token interceptors can't attach auth headers to raw WebSockets easily, the frontend passes `access_token` query parameters which `JwtBearer` intercepts and attaches to the Hub context.
2. **Strict Mode Safety**: Next.js 16/React 18's strict mode rapid remounts are managed using persistent connections wrapped in `useRef` hooks to bypass `stop() was called during negotiate` exceptions.
3. **Multi-Tenant Hub Groups**: `OnConnectedAsync` reads the `BusinessId` claim and strictly maps connections to a named group (`Business_X`).
4. **Push Triggers**: Core business workflows (like generating a sales report) use DI to fetch the generic `IHubContext<T>` and issue non-blocking broadcasts to these target groups securely.

---

## 4. Media & Document Systems
- **Photo Upload Pipeline**: Integrates directly with Cloudinary. The domain layer extracts file byte streams via `IFormFile`, pushes them to the Cloudinary CDN via `PhotoUploadService`, and returns responsive image asset keys and URLs.
- **Rotativa PDF Generation**: Utilizes `Rotativa.AspNetCore` (bundling the `wkhtmltopdf` native utility) inside `Unity_Inventory.WebApp` to compose printable invoices, packing lists, and sales reports directly from Razor views.
