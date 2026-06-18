# AGENTS.md — Agent Workspace Reference

This document provides building, running, and diagnostic workflows for the **Unity Inventory Management System (IMS)**, along with the required cognitive entry protocol for agentic developers.

---

## 1. Agent Entry Protocol & Spec-Driven Workflow

This project strictly follows a **Spec-Driven and Review-Driven** workflow powered by an Obsidian vault located at `UnityInventory-Notes`. **Do not write "vibe code"**.

### A. Global Context Initialization
When starting a session, you **must** familiarize yourself with the global configuration in the following order:
1. `UnityInventory-Notes/_Global/project-overview.md`
2. `UnityInventory-Notes/_Global/architecture-context.md`
3. `UnityInventory-Notes/_Global/code-standards.md`
4. `UnityInventory-Notes/_Global/ui-context.md`
5. `UnityInventory-Notes/_Global/ai-workflow-rules.md`

### B. The Spec-Driven AI Implementation Loop
When you are tasked with implementing a feature, you must strictly follow this loop:
1. **Read Spec**: Locate the spec for your task within the relevant domain folder (e.g., `UnityInventory-Notes/Inventory/MyFeature.md`).
2. **Check Status**: Read the YAML frontmatter. If the status is `draft`, **do not implement**. Request that the user reviews and approves the spec first. If the status is `approved` or `ready-for-implementation`, you may proceed.
3. **Implement**: Write the code per the architectural guidelines and the spec.
4. **Update Status**: Once finished and verified, update the spec's frontmatter status to `implemented` and check off items in the Review Checklist.

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
