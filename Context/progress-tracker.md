# Progress Tracker

This document tracks the active development progress, implemented modules, current milestones, and planned roadmap items for the **Unity Inventory Management System (IMS)**.

---

## 1. System Status & Architecture Overview

The system is currently fully scaffolded with a rich multi-tenant backend and dual frontends (Next.js 16 and ASP.NET Core MVC companion app).

- **Current Status**: Stable / Active Development
- **Core Focus**: Hardening security boundaries, performance optimization, and aligning permissions and claims.

---

## 2. Completed Milestones & Feature Registry

### A. Core Platform Infrastructure
- [x] **Layered Architecture Setup**: Clean decoupling of Presentation (`Api`), Domain (`Domain`), Database (`Database`), and Shared Contracts (`Shared`).
- [x] **Multi-Tenancy Scoping**: Core database tables mapped with `BusinessId` foreign keys to enforce tenant scoping.
- [x] **Secure Authentication**: Hashed credentials using BCrypt.Net and access token issuance using JWT Bearer authentication.
- [x] **Token Rotation System**: Hashed refresh token tracking in `Tbl_UserTokens` with sliding expiry and active revocation checks.
- [x] **Interactive Documentation**: Swagger and Scalar API reference environments mapped in development pipelines.

### B. Domain Features & Business Workflows
- [x] **Businesses CRUD**: Tenant onboarding, business workspace listings, and secure workspace access validation.
- [x] **Customer CRM**: Paginated customer directories, transactional tracking, and concurrency protection with `VersionStamp` rowversion tokens.
- [x] **Product Inventory Catalog**: Detailed product configurations, dynamic category mapping (flat and tree structures), and stock decrement workflows on sales report generation.
- [x] **Dynamic Pricing override**: Custom per-customer, per-product price mapping in `Tbl_CustomerPrices`.
- [x] **Analytical Dashboard**: KPI aggregation (Revenue velocity, active workspace users, top-selling inventory catalog items, and sales graphs).
- [x] **Cloudinary Media Pipeline**: Direct file stream uploads to Cloudinary returning CDN assets for customer profile cards and inventory views.
- [x] **Transactional Sales**: Core transactions mapping order reports (`TblReport`), voucher details (`TblVoucher`), inventory stock decrements, and customer spending summaries.
- [x] **PostgreSQL Switch Alignment**: Resolved the database-level timestamp comparison conflict between the schema (`timestamp without time zone`) and EF Core configuration. Configured Npgsql's legacy timestamp behavior globally and decoupled service projections.

### C. Advanced RBAC Permission Engine
- [x] **Precedence Resolvers**: Custom evaluation logic prioritizing specific User overrides (`UserId != null`) over generic Role boundaries (`UserId == null`).
- [x] **Hard Revocations**: `IsRevoked` flags to immediately deny access regardless of nested roles.
- [x] **Endpoint Security Annotations**: Custom `[Permission("menu", "action")]` filters to dynamically protect Controller endpoints.

### D. Frontend Applications
- [x] **Next.js SPA Portal (`Unity_Inventory.Frontend`)**: Built on Next.js 16 with React 19, styled with Tailwind CSS v4, dynamic light/dark modes, Recharts visualizations, and client-side token interceptors.
- [x] **MVC Companion UI (`Unity_Inventory.WebApp`)**: Classic server-rendered UI integrating jQuery client-side fetch modules and Rotativa PDF formatting layouts.

---

### E. Completed Features (Latest)
- [x] **Sales Summary Generation**: Added functionality to generate comprehensive sales summaries (daily, weekly, monthly, yearly) from sales report data, including revenue, volume, customer, and product insights
- [x] **Summary Storage**: Utilized existing TblSummaryArchive table for persisting generated summaries
- [x] **Summary API**: Created RESTful endpoints for retrieving and generating sales summaries
- [x] **Business Intelligence**: Enhanced analytics capabilities with pre-calculated summary data for improved dashboard performance
- [x] **Hangfire Recurring Summary Jobs**: Installed and configured PostgreSQL-backed Hangfire server in `FeaturesManager.cs` and `Program.cs`. Scheduled recurring DAILY, MONTHLY, and YEARLY jobs to compile analytics automatically.
- [x] **Custom Summary Cadence**: Expanded the domain compilation engine to support on-demand CUSTOM date ranges (`from` -> `to`) through the API and Next.js frontend filters.
- [x] **Gemini AI Synthesis Integration**: Implemented `AiService` invoking the Google Gemini 2.5 Flash API to compile custom summaries, featuring micro-interactive UI loading states and robust simulated local fallbacks.
- [x] **Permission System Update**: Added `summary` module to RBAC system with appropriate permissions for Owner, Admin, and Staff roles via seeder updates.
- [x] **Frontend Integration**: Removed mock seed data from sales summaries page and updated to rely solely on live API data for summary generation and display.
- [x] **SignalR Real-Time Broadcasting**: Designed and implemented `SaleSummaryHub` and `DashboardHub` to push live data events to connected frontend clients when a transaction occurs in the workspace.
- [x] **Secure Multi-Tenant WebSockets**: Hardened SignalR Hubs with `Authorize` attributes, token query parameters (`access_token`), and explicit BusinessId group isolation (`$"Business_{businessId}"`) via JWT claims extraction.
- [x] **React 18 Strict Mode Fixes**: Refactored the Next.js `HubConnectionBuilder` integrations in the frontend to utilize persistent React `useRef` connections, bypassing classic unmount-remount race conditions and preventing 401 Negotiation drops when switching UI filter tabs.

---

## 3. Active Roadmap & Core Enhancements

The following tasks represent the active roadmap and architectural improvements prioritized for the next phase of development:

### Phase 1: Security & Alignment (High Priority)
- [ ] **JWT Claim Name Alignment**: Standardize JWT claim types emitted by `TokenService` with the lowercase claim naming conventions expected by `PermissionFilter` to ensure robust authorization.
- [ ] **Permission Resolve Alignment**: Replicate the user-over-role precedence order of `PermissionService.HasPermissionAsync` inside `TokenService.GetUserPermissionsAsync` during JWT compilation.
- [ ] **Stale dbscript.sql Regeneration**: Update `dbscript.sql` to match the active EF Core models, including `Tbl_RolePermissions`, `TblCategory`, and profile image schema columns.

### Phase 2: System Hardening & Performance (Medium Priority)
- [ ] **Centralized Exception Handling Middleware**: Implement global error-interceptor middleware to capture unhandled exceptions, log them structured via Serilog, and return uniform `Result.Failure` JSON payloads.
- [ ] **Caching Layer Integration**: Introduce an in-memory or Redis-backed cache layer inside `PermissionService` to reduce database load on endpoint authorization checks.
- [ ] **Fluent DTO Validation**: Integrate `FluentValidation` to validate incoming requests (e.g., email format, password complexity, price bounds) before hitting controller logic.

### Phase 3: Developer Experience & Expansion (Low Priority)
- [ ] **API Versioning Strategy**: Introduce URL-based API versioning (e.g., `/api/v1/...`) to prepare the codebase for backward compatibility during expansion.
- [ ] **Test Coverage Suite**: Add dedicated unit and integration testing projects to validate complex transactional processes (such as sales generation and permission precedence sorting).
- [ ] **Next.js Middleware**: Move client-side authorization guards to Next.js `middleware.ts` to block rendering of protected pages server-side for unauthorized sessions.
