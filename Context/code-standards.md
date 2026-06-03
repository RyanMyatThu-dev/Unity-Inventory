# Code Standards & Guidelines

This document outlines the strict coding standards, design patterns, and programming conventions required for developing on both the Backend (.NET 8) and Frontend (Next.js 16) layers of the **Unity Inventory Management System (IMS)**.

---

## 1. Backend Standards (.NET 8)

### A. General C# Guidelines
- **Implicit Usings**: Enabled. Avoid bloated file header import blocks.
- **Nullable Reference Types**: Enabled. Explicitly declare nullability using `?` (e.g., `string? Remarks`) to avoid compiler warnings and NullReferenceExceptions.
- **Formatting**: Strictly PascalCase for classes, records, interfaces, properties, and methods. CamelCase with an underscore prefix for private read-only fields (e.g., `private readonly IMSDbContext _db`).

### B. Dependency Injection & Service Lifetime
- **Constructor Injection**: Always inject dependencies via constructors. Avoid service locator patterns.
- **Service Lifetimes**: Register business and domain services as `Scoped` using the `FeaturesManager.AddDomain` extension method. Singletons should only be used for stateless, thread-safe helper services.

### C. Asynchronous Programming (TAP)
- **Async Throughout**: All network, database, and file operations must be asynchronous from the controller level down to the EF Core calls.
- **Suffix**: Append `Async` to all asynchronous method signatures (e.g., `CreateReportAsync`).
- **Cancellation**: Pass `CancellationToken` down the call stack if supported.

### D. Data Layer & EF Core Conventions
- **AsNoTracking()**: Use `AsNoTracking()` for read-only LINQ queries to bypass the EF change tracker and optimize performance.
- **Explicit Relationships**: Configure all keys, indexes, unique constraints, and foreign key behaviors inside `OnModelCreating` via the Fluent API.
- **RowVersion / Concurrency**: Verify optimistic concurrency tokens (`VersionStamp` / `byte[]`) when deleting or updating record states to prevent concurrent override errors.

### E. Service Responses & Exception Handling
- **Result Pattern**: Never return raw database entities, nullable data values, or throw domain exceptions to control logical flows. Always wrap service responses inside `Result` or `Result<T>` blocks.
- **Exceptions**: Let critical system exceptions bubble up naturally (to be handled by centralized filters) instead of writing repetitive try/catch blocks that return generic error statuses.

---

## 2. Frontend Standards (Next.js 16 / React 19)

### A. General TypeScript & React Guidelines
- **Strict Mode**: `strict: true` must remain enabled. Explicit type casting (`as any`) is strictly forbidden.
- **Component Definitions**: Define functional components using the standard arrow function structure:
  ```tsx
  export const Sidebar = () => { ... }
  ```
- **File Naming**: Component files must be written in PascalCase (e.g., `ConfirmDialog.tsx`). Page files and routes must be lowercase kebab-case directories containing a `page.tsx` file.

### B. App Router & Client Execution
- **`'use client'`**: Since the application is structured as a rich SPA that interacts directly with browser `localStorage` and client state contexts, all page and layout components must declare the `'use client'` directive at the very top of the file.
- **Path Aliases**: Always reference external directories using the `@/` path alias pointing to the `src/` directory (e.g., `import { api } from '@/services/api'`).

### C. API Interactions (Axios)
- **Shared Instance**: All HTTP calls must execute through the shared axios client configured in `@/services/api.ts`.
- **Automatic Interception**: Rely on response and request interceptors to automatically set authorization headers, manage token rotation via the `x-access-token` header, and capture 401 statuses for immediate logging out.
- **Optimistic UI Updates**: Detail modals should implement optimistic state updates. Update local client-side lists immediately when saving user forms, followed by a background database sync.

### D. State Management & Hooks
- **Localized State**: Prefer local React states (`useState`, `useReducer`) and standard callbacks over global storage providers. Global states must be reserved strictly for system-wide contexts (such as `AuthContext`).
- **Optimization**: Memoize complex sub-components and rows (`React.memo`) and hook dependencies (`useCallback`, `useMemo`) on dense grids (such as inventory listing) to eliminate redundant re-rendering lag.

---

## 3. General Architecture Rules
- **No Direct References**: Frontend applications must never reference business logic layers or DbContexts directly. All system queries must route through the ASP.NET Core API layer.
- **No Shared Secrets**: Never check API credentials, database strings, or encryption keys into source control. Always read secrets from configuration settings (`appsettings.json` or `.env.local` files).
- **No Reverts**: Never rollback or reverse codebase changes unless explicitly directed or when an active test fails, and do not introduce files that are outside the requested boundaries.

---

## 4. DateTime & Timezone Handling Standards

### A. Backend Storage & Queries (.NET / Postgres)
- **Local Time Storage**: Always store transaction timestamps, reports, last-updated dates, and summaries using the local system time (`DateTime.Now`). The database tables use `timestamp without time zone` which stores these timestamps literally.
- **UTC Exception**: Reserve `DateTime.UtcNow` exclusively for token provisioning (JWT access/refresh tokens) and security handshake expirations to prevent network/client synchronization drift.

### B. Frontend Date Extraction & Display (Next.js)
- **Extraction Formatting**: When formatting dates to send to the API (such as custom start/end queries), NEVER use `date.toISOString().split('T')[0]`. This will shift the date to the previous day or year for local times near timezone boundaries due to UTC timezone offsets. Always use a helper like `formatLocalDate` to parse by local day/month/year components.
- **Regional Display Rendering**: The Myanmar standard display format is `dd-mm-yyyy`. All date readouts in list tables, ledger cards, detail models, and headers must format dates to this standard using the shared `formatDateToDisplay` function.

