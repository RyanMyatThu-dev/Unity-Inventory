# CLAUDE.md — Agent Workspace Reference

This document provides building, running, and diagnostic workflows for the **Unity Inventory Management System (IMS)**, along with the required cognitive entry protocol for agentic developers.

---

## 1. Agent Entry Protocol (Mandatory Context Reading Order)

When initializing a new session or task, AI agents **must** read the documentation context in the following industry-standard order to establish progressive system awareness:

1. **`PROJECT_OVERVIEW.md`** (Root or Context folder): The unified "Source of Truth" for system boundaries, tech stacks, databases, and endpoint mapping.
2. **`Context/architecture-context.md`**: Layer boundaries, authorization precedence engines, dynamic customer pricing models, and transactional lifecycles.
3. **`Context/code-standards.md`**: Syntax, formatting, dependency injection, React hooks optimization, and async/TAP conventions.
4. **`Context/ui-context.md`**: Tailwind CSS v4 variables, light/dark toggles, and layout shells.
5. **`Context/progress-tracker.md`**: Active feature registries, roadmap initiatives, and technical debt.
6. **`Context/ai-workflow-rules.md`**: Safety boundaries, command explanations, and self-verification mandates.

---

## 2. Command Reference

### A. Backend (.NET 8 Core / Entity Framework 8)
- **Restore Dependencies**: 
  ```bash
  dotnet restore
  ```
- **Build Solution**: 
  ```bash
  dotnet build
  ```
- **Build Specific Projects**:
  - API Host: `dotnet build Unity_Inventory.Api/Unity_Inventory.Api.csproj`
  - WebApp MVC: `dotnet build Unity_Inventory.WebApp/Unity_Inventory.WebApp.csproj`
- **Run Host Services**:
  - REST API: `dotnet run --project Unity_Inventory.Api/Unity_Inventory.Api.csproj`
  - WebApp UI: `dotnet run --project Unity_Inventory.WebApp/Unity_Inventory.WebApp.csproj`
- **Format Codebase**:
  ```bash
  dotnet format
  ```
- **EF Migrations Management**:
  - Add Migration: `dotnet ef migrations add <Name> --project Unity_Inventory.Database --startup-project Unity_Inventory.Api`
  - Update Database: `dotnet ef database update --project Unity_Inventory.Database --startup-project Unity_Inventory.Api`

### B. Frontend (Next.js 16 / React 19)
*Note: Execute these commands inside the `Unity_Inventory.Frontend/` subdirectory.*
- **Install Dependencies**:
  ```bash
  npm install
  ```
- **Run Development Watcher**:
  ```bash
  npm run dev
  ```
- **Build Production Bundles**:
  ```bash
  npm run build
  ```
- **Run Linter (ESLint Flat Config)**:
  ```bash
  npm run lint
  ```
- **TypeScript Type Checks**:
  ```bash
  npx tsc --noEmit
  ```

---

## 3. Core Architectural Commitments

- **Asynchronous Flow**: Every network, database, and stream operation must be strictly `async`/`await`.
- **Result Wrapping**: All business boundary controllers must return standardised `Result` or `PagedResult` envelopes.
- **Claim Scoping**: Extract the active `BusinessId` from the active JWT claims context. Returning bare un-scoped rows is prohibited.
- **Client-Side SPA Architecture**: Next.js views are client-rendered (`'use client'`). State mutations should use optimistic updates followed by backend synchronization via our Axios client.
- **Progress Tracking Sync**: Every active code edit or structural modification must be recorded inside `Context/progress-tracker.md` to ensure contextual tracking.
