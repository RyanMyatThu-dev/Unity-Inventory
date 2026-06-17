# CLAUDE.md — Agent Workspace Reference

This document provides building, running, and diagnostic workflows for the **Unity Inventory Management System (IMS)**, along with the required cognitive entry protocol for agentic developers.

---

## 1. Agent Entry Protocol (Mandatory Context Reading Order)

When initializing a new session or task, AI agents **must** read the documentation context in the following industry-standard order to establish progressive system awareness:

1. **`UnityInventory-Notes/System Context/project-overview.md`**: The unified "Source of Truth" for system boundaries, tech stacks, databases, and endpoint mapping.
2. **`UnityInventory-Notes/System Context/architecture-context.md`**: Layer boundaries, authorization precedence engines, dynamic customer pricing models, and transactional lifecycles.
3. **`UnityInventory-Notes/System Context/code-standards.md`**: Syntax, formatting, dependency injection, React hooks optimization, and async/TAP conventions.
4. **`UnityInventory-Notes/System Context/ui-context.md`**: Tailwind CSS v4 variables, light/dark toggles, and layout shells.
5. **`UnityInventory-Notes/System Context/progress-tracker.md`**: Active feature registries, roadmap initiatives, and technical debt.
6. **`UnityInventory-Notes/System Context/ai-workflow-rules.md`**: Safety boundaries, command explanations, and self-verification mandates.


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
- **Progress Tracking Sync**: Every active code edit or structural modification must be recorded inside `UnityInventory-Notes/System Context/progress-tracker.md` to ensure contextual tracking.

---

## 4. Spec-Driven Subagent Workflow

When developing new features or performing non-trivial tasks:
- **Specification First**: Reference or create a feature specification inside `UnityInventory-Notes/Specs/[FeatureName].md`.
- **Task Decomposition**: Tasks should be broken down into individual subagent task definitions under `UnityInventory-Notes/Tasks/[TaskName].md`.
- **Subagent Execution**: Spawn subagents using native multi-agent capabilities, feeding the task spec file path as context.
- **Progress Tracking**: Update status in the subagent task file, parent specification checklist, and the main `UnityInventory-Notes/Dashboard.md` orchestrator.
- **Collaborative Brainstorming**: When discussing design ideas, market pain points, or architecture decisions, participate in the respective documents using role-based markdown callout blocks:
  - `> [!NOTE] AI Proposal: [Propose feature logic/architecture]`
  - `> [!IMPORTANT] Architect Feedback: [Reserved for developer review]`
  - `> [!TIP] Decision: [Agreed architecture direction]`

## 5. Collaborative Brainstorming & Learning Mode

When the human architect wants to explore market problems, domain knowledge, or new features:

**Preferred Workflow:**
- Start in **Brainstorm Mode** using the Lead Orchestrator role.
- Spawn specialized sub-agents (Market Researcher, Domain Expert, Feature Architect, Competitor Analyst).
- Use Obsidian callouts for transparent collaboration:
  > [!NOTE] **Market Researcher:** [Findings...]
  > [!IMPORTANT] **Architect Review:** [My feedback...]
  > [!TIP] **Decision:** [Agreed direction]

**Goals in this mode:**
- Identify real IMS market pain points
- Deepen domain knowledge together
- Generate cohesive, high-impact feature ideas (not scattered tickets)
- Allow the human (senior architect) to review all outputs and code

After ideation, transition naturally into Spec-Driven development for chosen features.