# Feature & Architecture Decisions Log (ADR)

This note tracks the architectural decision records (ADRs) and product decisions for the **Unity Inventory Management System (IMS)**.

---

## 🤝 Collaboration Legend
To keep discussion roles clear, we use the following callout conventions:
- `> [!NOTE] AI Proposal: [Details...]` — Draft concepts proposed by the AI.
- `> [!IMPORTANT] Architect Feedback: [Details...]` — Senior review, comments, and constraints.
- `> [!TIP] Decision: [Details...]` — Final approved path or architectural commitment.

---

## 📂 Active Decision Records

- [[Decisions/Feature-Decisions#FDR-001 Standardizing JWT Claims and RBAC Evaluation|FDR-001: Standardizing JWT Claims and RBAC Evaluation]] (`Accepted`)
- [[Decisions/Feature-Decisions#FDR-002 Obsidian Vault and Subagent Orchestration Workflow|FDR-002: Obsidian Vault and Subagent Orchestration Workflow]] (`Accepted`)

---

## FDR-001: Standardizing JWT Claims and RBAC Evaluation

- **Status**: `Accepted`
- **Date**: 2026-06-17
- **Author**: Antigravity & Senior Architect

### Context
Our backend checks permissions using custom endpoint filters `[Permission("menu", "action")]`. However, `TokenService` was generating access tokens with mismatched claims compared to what `PermissionFilter` was resolving. Additionally, role precedence evaluated in the database (where a user's direct permission overrides a role permission) was not properly aligned during JWT construction.

### Options Considered
1. **Option A (Dynamic DB Check)**: Intercept every endpoint request, query PostgreSQL to resolve direct and role permissions.
   * *Pros*: Real-time updates; no stale authorization states.
   * *Cons*: Heavy database hit on every single API request.
2. **Option B (Claims Encapsulation)**: Resolve the final combined permissions list (including user-over-role overrides) during login/refresh, and embed the list as claims inside the JWT token.
   * *Pros*: Sub-millisecond permission checks inside the controller filter with zero database roundtrips.
   * *Cons*: Permission edits only take effect after token renewal/refresh.

### Decision
> [!TIP] Decision: Option B (Claims Encapsulation)
> We will embed permissions directly in the JWT claims context. Precedence logic (user-over-role priorities and hard revocations) will be evaluated in `TokenService.GetUserPermissionsAsync` during token compilation, matching the rules of `PermissionService`.

### Consequences
- Controllers can perform lightning-fast authorization checks.
- If an administrator updates a user's permissions, they must wait for the JWT to expire (or implement token rotation) before the changes apply.

---

## FDR-002: Obsidian Vault and Subagent Orchestration Workflow

- **Status**: `Accepted`
- **Date**: 2026-06-17
- **Author**: Antigravity & Senior Architect

### Context
To support orchestrated, spec-driven development using subagents in Antigravity 2.0, we need a unified directory that acts as the single source of truth for documentation, feature specs, and task tracking. The legacy `Context/` folder was isolated and did not support interactive brainstorming or markdown-based subagent prompts.

### Options Considered
1. **Option A**: Keep `Context/` at the root and write python orchestration scripts there.
2. **Option B**: Leverage the `UnityInventory-Notes/` vault, migrating static documentation into `System Context/`, establishing standard `Specs/` and `Tasks/` directories, and running subagents natively via Antigravity 2.0 against task markdown prompts.

### Decision
> [!TIP] Decision: Option B (Obsidian Vault Migration)
> Establish the single source of truth inside the Obsidian vault. Merge all root documentation, create Markdown templates, design an orchestrator `Dashboard.md`, and delete the original `Context/` folder.

### Consequences
- Single, unified workspace for both human architects and AI agents.
- Cleaner project root structure.
- Version-controlled brainstorming logs and decisions.
