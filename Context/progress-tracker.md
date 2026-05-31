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

### C. Advanced RBAC Permission Engine
- [x] **Precedence Resolvers**: Custom evaluation logic prioritizing specific User overrides (`UserId != null`) over generic Role boundaries (`UserId == null`).
- [x] **Hard Revocations**: `IsRevoked` flags to immediately deny access regardless of nested roles.
- [x] **Endpoint Security Annotations**: Custom `[Permission("menu", "action")]` filters to dynamically protect Controller endpoints.

### D. Frontend Applications
- [x] **Next.js SPA Portal (`Unity_Inventory.Frontend`)**: Built on Next.js 16 with React 19, styled with Tailwind CSS v4, dynamic light/dark modes, Recharts visualizations, and client-side token interceptors.
- [x] **MVC Companion UI (`Unity_Inventory.WebApp`)**: Classic server-rendered UI integrating jQuery client-side fetch modules and Rotativa PDF formatting layouts.

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
