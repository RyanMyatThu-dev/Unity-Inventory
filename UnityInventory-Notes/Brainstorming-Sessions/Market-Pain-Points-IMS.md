# Brainstorming: Market Pain Points in Inventory Management Systems (IMS)

This document is a collaborative space to analyze core market pain points in inventory management systems, mapping them to our system boundaries and compiling features.

---

## 🤝 Collaboration Legend
To keep discussion roles clear, we use the following callout conventions:
- `> [!NOTE] AI Proposal: [Details...]` — Draft concepts proposed by the AI.
- `> [!IMPORTANT] Architect Feedback: [Details...]` — Senior review, comments, and constraints.
- `> [!TIP] Decision: [Details...]` — Final approved path or architectural commitment.

---

## 🔄 1. Real-Time Synchronization & Multi-Tab Consistency
In busy retail or warehouse environments, users open multiple tabs or run multiple terminals. If stock updates on one terminal, others must update immediately to prevent double-selling or outdated views.

> [!NOTE] AI Proposal: Real-Time State Management
> **Market Pain Point**: Traditional inventory systems require page refreshes to reflect new stock counts, leading to race conditions where two operators sell the same last item.
> **Our Codebase Context**: We have implemented standard SignalR hubs (`SaleSummaryHub`, `DashboardHub`) to push updates, but we need to ensure our Next.js frontend state hooks handle connection drops gracefully (e.g., auto-reconnecting and doing a delta-fetch upon re-establishing connection).
> **Proposed Solution**: 
> 1. Implement local storage synchronization or a unified state manager in Next.js to share connection states across tabs.
> 2. Design a "reconnection validation" routine: if SignalR drops and reconnects, query `/api/summaries/delta` for any missed broadcast messages.

> [!IMPORTANT] Architect Feedback:
> *Waiting for Senior Architect review.*

> [!TIP] Decision:
> *Pending discussion.*

---

## 🏢 2. Multi-Tenancy Scoping & Data Isolation
Security is a massive market pain point. Multi-tenant systems must absolutely guarantee that data from Business A never leaks to Business B under any API request or database query.

> [!NOTE] AI Proposal: Automatic Query Filtering & Claim Validation
> **Market Pain Point**: Developers manually appending `Where(x => x.BusinessId == currentBusinessId)` to every query is error-prone. One forgotten filter leaks sensitive commercial data.
> **Our Codebase Context**: We resolve `BusinessId` from the JWT claims context in our services. However, this is currently done procedurally in individual controllers or services.
> **Proposed Solution**:
> 1. Implement **Global Query Filters** in EF Core (`DbContext`) that automatically scope all entities implementing an `IMultiTenant` interface to the active tenant claim.
> 2. Ensure EF Core shadow properties or interceptors automatically set `BusinessId` on entity insertions.

> [!IMPORTANT] Architect Feedback:
> *Waiting for Senior Architect review.*

> [!TIP] Decision:
> *Pending discussion.*

---

## 📦 3. Stock Decrement Concurrency & Double-Selling
High-throughput sales (e.g., flash sales, wholesale invoice processing) create database lock contentions and race conditions.

> [!NOTE] AI Proposal: Optimistic Locking vs. Queueing
> **Market Pain Point**: Database deadlocks when multiple transactions try to decrement the same product stock simultaneously, or negative stock balances due to slow read-modify-write loops.
> **Our Codebase Context**: We currently use a `VersionStamp` (`rowversion`) token on some entities. We need to verify how our stock decrement logic in `TblReport` / `TblVoucher` handles concurrency exceptions.
> **Proposed Solution**:
> 1. Formulate a retry policy for `DbUpdateConcurrencyException` in the sales transaction service.
> 2. Evaluate using PostgreSQL `FOR UPDATE` row locks for strict write-heavy sections or moving stock updates to a lightweight Redis/In-Memory transaction queue.

> [!IMPORTANT] Architect Feedback:
> *Waiting for Senior Architect review.*

> [!TIP] Decision:
> *Pending discussion.*

---

## 📊 4. Report Generation & Analytical Summary Latency
Compiling live dashboards, revenue velocity graphs, and customer sales patterns across millions of records in real time causes extreme database load and slows down the API.

> [!NOTE] AI Proposal: Materialized Views & Scheduled Compilations
> **Market Pain Point**: Aggregating sales reports on the fly is slow. Users experience 10+ second load times when generating monthly or yearly custom range reports.
> **Our Codebase Context**: We recently introduced a Hangfire recurring compiler for Daily/Monthly/Yearly jobs and a custom range summary engine.
> **Proposed Solution**:
> 1. Utilize a database-level caching strategy (e.g., PostgreSQL materialized views updated asynchronously on sales report commits).
> 2. Use our Gemini AI Synthesis service to not just summarize, but *predict* weekly demand patterns based on historical `TblSummaryArchive` data.

> [!IMPORTANT] Architect Feedback:
> *Waiting for Senior Architect review.*

> [!TIP] Decision:
> *Pending discussion.*
