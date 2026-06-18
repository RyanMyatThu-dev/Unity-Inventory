# Project Overview (Source of Truth)

This document reflects the **Unity Inventory Management System (IMS)** codebase: Entity Framework Core models in `Unity_Inventory.Database`, domain services in `Unity_Inventory.Domain`, REST API in `Unity_Inventory.Api`, the **primary frontend client portal** in `Unity_Inventory.Frontend` (Next.js 16), and an ASP.NET Core MVC companion app in `Unity_Inventory.WebApp`. Where the checked-in SQL script `dbscript.sql` diverges from EF (older snapshot), **EF Core configuration and entity classes are authoritative** unless you explicitly migrate the database from that script.

---

## Backend Architecture & API Reference

The backend follows a clean, layered architecture with ASP.NET Core Web API as the presentation layer, domain services for business logic, and Entity Framework Core for data access.

### Architectural Overview

**Layered Structure:**
- **Presentation Layer**: `Unity_Inventory.Api` - REST controllers, middleware, authentication, custom filters
- **Domain Layer**: `Unity_Inventory.Domain` - Business logic interfaces, service implementations, Cloudinary uploading
- **Data Layer**: `Unity_Inventory.Database` - EF Core DbContext and entity models
- **Shared Layer**: `Unity_Inventory.Shared` - Common DTOs, Result types, pagination contracts

**Key Patterns:**
- Dependency Injection with constructor injection throughout
- Service feature pattern via domain service interfaces (`I*Service`) and implementations
- Result pattern (`Result<T>` and `PagedResult<T>`) for consistent service boundaries
- Soft deletes using `DeleteFlag` boolean columns
- Optimistic concurrency with `VersionStamp` rowversion tokens
- Business-scoped data access via JWT claims

---

## Frontend Architecture Reference

The system utilizes a modern dual-frontend approach: the **Next.js SPA Portal** is the primary interaction layer for active workspace users, administrators, and business owners, while the **MVC Companion App** serves as a lightweight alternative and host for PDF reporting pipelines.

### A. Main Portal (`Unity_Inventory.Frontend`)
- **Framework & Tech**: Next.js 16.2.6 (App Router), React 19.2.4, Tailwind CSS v4, Lucide Icons, and Sonner Toast notifications.
- **Client-Only Execution**: Configured as an interactive Single Page Application. Every page utilizes the `'use client'` directive to interface with client state managers and browser `localStorage`.
- **API Client & Interceptor Lifecycle**:
  - Leverages **Axios** with global interceptors.
  - Automatically appends active `Authorization: Bearer <token>` headers to outgoing requests.
  - Monitors the `x-access-token` header on inbound responses for silent, seamless JWT access token rotation.
  - Intercepts 401 Unauthorized errors to automatically purge local caches and redirect sessions to the `/login` route.
- **Authentication Guard**: Handled client-side inside the root `MainLayout` shell component, verifying access tokens and active workspaces before loading pages.
- **State Management**: React Context (`AuthContext.tsx`) controls authentication states and active business context toggles. Page-level states are managed locally using optimized React hooks.

### B. MVC Companion App (`Unity_Inventory.WebApp`)
- **Framework & Tech**: ASP.NET Core MVC, Tailwind CSS, jQuery AJAX, and Rotativa.AspNetCore.
- **Reporting Pipeline**: Integrates native **Rotativa (wkhtmltopdf)** binaries to compile server-side high-contrast invoice and sales report PDFs.
- **Decoupled API Consumption**: Connects to the same REST API ports using a tailored JS client (`wwwroot/js/api.js`) to synchronize session data and states.

---

## Authentication & Authorization

### JWT-Based Authentication:
- **Access tokens**: Short-lived, business-scoped, containing user identity, business workspaces, and resolved permission claims.
- **Refresh tokens**: HTTP-only secure cookies with active rotation (7-day expiry).
- **Token validation**: Enforces strict Issuer, Audience, Lifetime, and Cryptographic SigningKey parameters.
- **Password hashing**: BCrypt with randomized salts.

### Permission System (RBAC):
- Database-driven permissions stored inside `Tbl_RolePermissions`.
- **Precedence Resolvers**: User-specific permission records override generic Role-based permissions.
- **Hard Deny**: `IsRevoked == true` overrides any active allowance checks.
- **Authorization Annotations**: Custom endpoint security filters (`[Permission("resource", "action")]`) dynamically evaluate database rules before exposing API controllers.

---

## Data Handling

### Entity Framework Core:
- Code-First mapping with explicit Fluent configurations inside `IMSDbContext.cs`.
- Asynchronous execution throughout the database repository stack.
- Optimized read operations utilizing trackless queries (`AsNoTracking()`).
- Unified pagination models supported by common `PaginationRequest` contracts.

### Data Flow:
1. **HTTP Action**: Triggered from the browser via Axios (Next.js) or fetch (MVC).
2. **Controller Routing**: Map request parameters, extract active `BusinessId` claims, and delegate execution.
3. **Domain Processing**: Execute transactional processes inside scoped Services using DI.
4. **Data Querying**: Query tables via DbContext, verify concurrency tokens, and apply change tracked modifications.
5. **JSON Returns**: Package statuses inside standard `Result` wrappers, serialized as camelCase.

---

## Key Table References

- `Tbl_Businesses` - Tenant accounts.
- `Tbl_Users` - System credentials and delete scopes.
- `Tbl_UserBusinesses` - Many-to-many user-tenant association mapped with roles (Owner, Admin, Staff).
- `Tbl_Customers` - Customer directories (LTV tracking, concurrency checks).
- `Tbl_Inventories` - Detailed catalog specifications.
- `Tbl_CustomerPrices` - Dynamic per-customer, per-product pricing override matrices.
- `Tbl_Reports` / `Tbl_Vouchers` - Transaction headers and sales detail lines.
- `Tbl_CustomerSummary` / `Tbl_InventorySummary` - Real-time aggregated analytical statistics.
- `Tbl_UserTokens` - Token rotation databases.
- `Tbl_RolePermissions` - Fine-grained access control lists.

---

## API Endpoints Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Authenticate user credentials, configure sliding cookie sessions | No |

### Business Management (`/api/business`)
| Method | Endpoint | Description | Auth | Permission |
|--------|----------|-------------|------|------------|
| POST | `/api/business/create` | Onboard new business workspace | Yes | Owner check |
| GET | `/api/business/my-businesses` | List all associated business workspaces | Yes | None |
| POST | `/api/business/switch-business/{id}` | Switch active business context and reissue JWT claims | Yes | None |

### Customers (`/api/customers`)
| Method | Endpoint | Description | Auth | Permission |
|--------|----------|-------------|------|------------|
| GET | `/api/customers` | Query paginated business customers | Yes | `customers:view` |
| GET | `/api/customers/{id}` | Query single customer details | Yes | `customers:view` |
| POST | `/api/customers` | Register a new customer | Yes | `customers:create` |
| PUT | `/api/customers` | Edit active customer parameters | Yes | `customers:update` |
| DELETE | `/api/customers/{id}` | Soft delete customer record (safeguarded via version) | Yes | `customers:delete` |

### Inventories (`/api/inventories`)
| Method | Endpoint | Description | Auth | Permission |
|--------|----------|-------------|------|------------|
| GET | `/api/inventories` | Query paginated inventory catalog | Yes | `inventory:view` |
| GET | `/api/inventories/{id}` | Fetch inventory item detail | Yes | `inventory:view` |
| POST | `/api/inventories` | Append new inventory record | Yes | `inventory:create` |
| PUT | `/api/inventories` | Edit inventory properties (supports picture uploads) | Yes | `inventory:edit` |
| DELETE | `/api/inventories/{id}` | Hard delete catalog item (safeguarded via version) | Yes | `inventory:delete` |
| POST | `/api/inventories/update-stock` | Increment or decrement stock balances manually | Yes | `inventory:edit` |

### Sales (`/api/sales`)
| Method | Endpoint | Description | Auth | Permission |
|--------|----------|-------------|------|------------|
| GET | `/api/sales/reports` | Query paginated order transactions | Yes | `sales:view` |
| GET | `/api/sales/reports/{id}` | Fetch transaction order line vouchers | Yes | `sales:view` |
| POST | `/api/sales/reports` | Execute a new order transaction | Yes | `sales:create` |
| DELETE | `/api/sales/reports/{id}` | Delete sales records | Yes | `sales:delete` |

### Sales Summary (`/api/summary`)
| Method | Endpoint | Description | Auth | Permission |
|--------|----------|-------------|------|------------|
| GET | `/api/summary/sales` | Get sales summary with filtering (type, date range) | Yes | `summary:view` |
| POST | `/api/summary/sales/generate` | Generate and store a sales summary | Yes | `summary:create` |
| GET | `/api/summary/sales/history` | Get historical sales summaries | Yes | `summary:view` |
| POST | `/api/summary/sales/analyze` | Analyze summary report with AI | Yes | `summary:analyze` |

### Categories (`/api/categories`)
| Method | Endpoint | Description | Auth | Permission |
|--------|----------|-------------|------|------------|
| GET | `/api/categories` | Query flat categories catalog | Yes | `categories:view` |
| GET | `/api/categories/tree` | Query recursive hierarchical category trees | Yes | `categories:view` |
| GET | `/api/categories/{id}` | Query single category details | Yes | `categories:view` |
| POST | `/api/categories` | Append a new category | Yes | `categories:create` |
| PUT | `/api/categories` | Modify category identity | Yes | `categories:edit` |
| DELETE | `/api/categories/{id}` | Remove category record | Yes | `categories:delete` |

### User Management (`/api/users`)
| Method | Endpoint | Description | Auth | Permission |
|--------|----------|-------------|------|------------|
| GET | `/api/users` | List users associated with a business | Yes | `users:view` |
| POST | `/api/users/register` | Register a new Owner user globally | No | None |
| POST | `/api/users/create` | Onboard Admin/Staff users directly into business | Yes | `users:create` |
| POST | `/api/users/update` | Modify user profile | Yes | None |
| POST | `/api/users/change-password` | Change user password | Yes | None |
| DELETE | `/api/users/delete/{id}` | Remove user from workspace | Yes | `users:delete` |

### Dashboard (`/api/dashboard`)
| Method | Endpoint | Description | Auth | Permission |
|--------|----------|-------------|------|------------|
| GET | `/api/dashboard` | Fetch aggregated performance KPIs, leaderboard, and sales trends | Yes | `dashboard:view` |
| GET | `/api/dashboard/revenue` | Query revenue snapshots | Yes | `dashboard:view` |
| GET | `/api/dashboard/customers` | Query customer metrics | Yes | `dashboard:view` |
| GET | `/api/dashboard/products` | Query product catalog metrics | Yes | `dashboard:view` |
| GET | `/api/dashboard/trends` | Query transaction velocity metrics | Yes | `dashboard:view` |

### Search (`/api/search`)
| Method | Endpoint | Description | Auth | Permission |
|--------|----------|-------------|------|------------|
| GET | `/api/search/products` | Perform focused products search | Yes | `inventory:view` |
| GET | `/api/search/categories` | Perform focused categories search | Yes | `categories:view` |
| GET | `/api/search/customers` | Perform focused customers search | Yes | `customers:view` |

### Permissions (`/api/permissions`)
| Method | Endpoint | Description | Auth | Permission |
|--------|----------|-------------|------|------------|
| GET | `/api/permissions/{businessId}/user/{userId}` | Query user's resolved permissions (Owner only) | Yes | Owner role |
| POST | `/api/permissions/grant` | Grant specific permission overrides (Owner only) | Yes | Owner role |
| POST | `/api/permissions/revoke` | Explicitly revoke specific permissions (Owner only) | Yes | Owner role |

### Customer Prices (`/api/customer-prices`)
| Method | Endpoint | Description | Auth | Permission |
|--------|----------|-------------|------|------------|
| GET | `/api/customer-prices/by-customer/{id}` | Fetch custom pricing records for a customer | Yes | `customerprices:view` |
| GET | `/api/customer-prices/by-inventory/{id}` | Fetch custom pricing records for a product | Yes | `customerprices:view` |
| GET | `/api/customer-prices/effective` | Calculate dynamic effective price for product during purchase | Yes | `customerprices:view` |
| POST | `/api/customer-prices` | Upsert customer-specific price overrides | Yes | `customerprices:edit` |
| DELETE | `/api/customer-prices` | Remove customer price overrides | Yes | `customerprices:delete` |

### SignalR Hubs (`/hubs`)
| Method | Endpoint | Description | Auth | Permission |
|--------|----------|-------------|------|------------|
| WS | `/hubs/salesummary` | Real-time broadcasting of sales summaries (Daily/Weekly/Monthly/Yearly) grouped by BusinessId | Yes | Owner role |
| WS | `/hubs/dashboard` | Real-time broadcasting of dashboard KPIs grouped by BusinessId | Yes | Owner, Admin role |

---

## Project Structure

```
IMS_New/
├── Unity_Inventory.Api/          # REST API Controllers, Middlewares, Auth filters
│   ├── Controllers/              # Auth, Business, Customers, Dashboard, Inventories, Sales, ...
│   ├── Filters/                  # Custom PermissionAttribute (authorization filter)
│   └── Program.cs                # Core ASP.NET bootstrapping pipelines
├── Unity_Inventory.Domain/       # Domain Layer: Feature services, validation, DTO models
│   ├── Features/                 # AuthService, SalesService, InventoryService, PermissionService, ...
│   └── FeaturesManager.cs        # DI extensions registering domain features
├── Unity_Inventory.Database/     # Data Layer: Entity models and Authoritative IMSDbContext
│   └── IMSDbContextModels/       # Scaffolded models and Fluent OnModelCreating bindings
├── Unity_Inventory.Frontend/     # Primary UI Portal: Next.js 16 (App Router), React 19, Tailwind CSS v4
│   ├── src/app/                  # App routes (globals.css, dashboard, inventory, customers, sales, ...)
│   ├── src/components/           # Reusable widgets, Sidebars, Root MainLayout guards
│   ├── src/context/              # AuthContext controlling login and workspace switching
│   └── src/services/             # Axios clients with custom token rotation interceptors
├── Unity_Inventory.WebApp/       # Companion UI: MVC layouts, JQuery AJAX fetchers, Rotativa PDF endpoints
├── Unity_Inventory.Shared/       # Result wrappers, PagedResult contracts, Pagination requests
├── Unity_Inventory.Seeder/       # Database seeding utility
└── Context/                      # System documentation (Architecture, UI, Code Standards, Tracker)
```

---

## Maintenance Notes & Active Technical Debt

1. **Database Schema authoritative bounds**: Always synchronize changes via the Entity Framework DbContext. Treat `dbscript.sql` as historical.
2. **JWT Claim Alignment**: Standardize JWT token claims names emitted by `TokenService` with those evaluated by `PermissionFilter` to ensure robust authorization.
3. **DI and Service Refinements**: Align permission interfaces and class definitions during future expansions.
4. **Distributed Caching**: When scaling, introduce a memory-caching layer inside `PermissionService` to avoid heavy database checks on every request.
