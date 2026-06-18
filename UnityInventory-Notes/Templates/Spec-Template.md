---
status: draft
domain: none
---
# [Feature Name]

## Problem Statement & Goal
[Provide a clear description of the problem this spec solves and the ultimate objective.]

## Technical Design

### Architecture
[Describe how this feature fits into the overall architecture. Which layers (API, Domain, DB, Frontend) are involved?]

### APIs & Contracts
[Define new endpoints, DTOs, request/response models, and any SignalR hubs.]

### DB Schema
[Detail any Entity Framework Core model changes, migrations, or database adjustments.]

## AI Workflow & Review Checklist
*The AI Agent must review and verify the following before and during implementation:*
- [ ] Spec status in frontmatter is `approved` or `ready-for-implementation`.
- [ ] New database schemas adhere to the existing EF Core conventions.
- [ ] New API endpoints are protected using the `[Permission("...", "...")]` filter.
- [ ] Domain services return `Result<T>` or `PagedResult<T>`.
- [ ] Ensure all local validations pass (e.g. `dotnet build`, `npm run build`, `npm run lint`).
- [ ] No direct conversation in source code comments; use this markdown file for updates instead.

## Test Plan & Acceptance Criteria
[Outline the scenarios that must pass for this feature to be considered complete. Note edge cases.]

## User Stories & UI Mockups
[Describe the feature from the user's perspective. Detail any Next.js component structures or Tailwind CSS considerations.]
