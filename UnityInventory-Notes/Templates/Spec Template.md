---
type: specification
status: draft
priority: medium
date: {{date}}
author: {{author}}
tags:
  - spec
---

# Feature Specification: [Feature Name]

## 1. Description & Context
Provide a brief summary of what this feature does, the problem it solves, and why it is being implemented.

## 2. Goals & Scope
- **In Scope**:
  - [List key requirements]
- **Out of Scope**:
  - [List non-requirements or deferred items]

## 3. Architecture & Design Changes

### Database Updates
- **New Tables/Columns**:
  - `Table/Column Description`
- **EF Core Mapping changes**:
  - Detail any migrations or mapping configuration modifications.

### Domain Layer (Business Logic)
- **New/Modified Services/Actions**:
  - [Class/Method Names](file:///path/to/file)
- **RBAC Roles & Permissions**:
  - List any new endpoint rules, scopes, or filters to apply.

### Presentation Layer (API & Frontend)
- **API Endpoints**:
  - `METHOD /api/v1/...`
- **Frontend Views/Components**:
  - Next.js component updates, hooks, and UI changes.

---

## 4. Implementation Tasks (Checklist for Subagents)
- [ ] **Task 1**: [Describe first component change]
  - Subagent task link: [[Tasks/Task-Name]]
- [ ] **Task 2**: [Describe second component change]
  - Subagent task link: [[Tasks/Task-Name]]

---

## 5. Verification Plan

### Automated Checks
- Commands to run to verify the build and tests:
  ```bash
  dotnet build
  npm run build
  ```

### Manual Checks
- Detailed steps to verify UI flows or manual integrations.
