# UI Context

This document outlines the visual identity, component architectures, theme systems, and user interaction standards of the **Unity Inventory Management System (IMS)** frontend applications.

---

## 1. Visual Identity & Theme System

The design is engineered to be a modern, highly functional B2B workspace focused on clarity, dense data grids, and smooth dashboard transitions.

### A. Next.js Tailwind CSS v4 Architecture
The `Unity_Inventory.Frontend` utilizes **Tailwind CSS v4**'s new native CSS configuration model inside `src/app/globals.css`. 
- **Variable Theme Binding**: Rather than a static JS config, variables are mapped directly in CSS using `@theme inline` blocks.
- **Color Variables**: Theme colors map dynamically to internal custom properties, aligning seamlessly with light and dark mode switches.

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

:root {
  --background: #ffffff;
  --foreground: #09090b;
  --muted: #71717a;
  --border: #e2e8f0;
  --radius: 6px;
}

.dark {
  --background: #09090b;
  --foreground: #fafafa;
  --muted: #a1a1aa;
  --border: #3f3f46;
}
```

### B. Dark / Light Mode Synchronization
- **Engine**: Handled using `next-themes` (`attribute="class"`), with an active class-based hook toggled inside `ThemeToggle.tsx`.
- **Hydration Safety**: Toggle buttons execute mounted-state lifecycle checks to eliminate flashing or hydration mismatch warnings during server pre-renders.

---

## 2. Layout & Shell Architecture

### A. Core Application Shell (`MainLayout.tsx`)
- **Protected Boundaries**: Contains client-side route guards. When loading is finished and no `accessToken` is found in `localStorage`, the user is redirected to `/login`.
- **Anatomy**: Renders a dynamic left-aligned `Sidebar` and a fixed-height top `Header` enclosing page breadcrumbs, workspace navigation controls, and contextual menus.
- **Responsive Layout**: Adapts gracefully from dense widescreen inventory grids to single-column mobile layouts.

### B. Workspace Business Switcher (`Sidebar.tsx`)
- Provides immediate business tenant scoping. Changing selection calls the `/switch-business/{id}` endpoint, exchanges the user context, rewrites credentials in `localStorage`, and triggers a full page reload to securely re-scaffold the new workspace state.

---

## 3. Page Patterns & Components

### A. Data Tables & Advanced Filtering
Inventory, Customers, and Sales pages share uniform page structures:
- **Search & Filters**: Enclose debounced searches and advanced criteria collapsible panels (e.g., category trees, price sliding limits, transaction dates, and sorting metrics).
- **View Toggles**: Allow users to toggle between detailed high-density tabular data grids (`Table View`) and card layouts with image thumbnails (`Grid View`).
- **Paginated Scrolling**: Interfaced with a standard pagination component that renders active indices, counts, limits, and handles state-driven navigation callbacks.

### B. Interactive Modals & Transaction Wizards
- **Product Details & Stock Overrides**: Enclose descriptive identity tabs, dynamic category trees, and isolated stock-adjustment drawers that provide direct numerical stock increment or decrement hooks.
- **New Transaction Wizard (`NewSaleModal`)**: A multi-step form:
  1. **Customer Selector**: Features paginated inline searches and auto-calculates current outstanding balances.
  2. **Product Basket**: Allows searching products, displays effective dynamically-calculated prices, and lets users add/modify items in real time.
  3. **Order Review**: Auto-calculates subtotal, applies taxes, and updates totals dynamically.

### C. Analytical Dashboard Visualizations
- **Metric Cards**: Display core KPIs (Revenue, Volume, Active Workspace Users, Global Inventory Stock) alongside trending color-coded indicators.
- **Velocity Charts**: Powered by `recharts`. Generates clean monthly or weekly sales bar graphs, tracking revenue velocity and volume outputs dynamically.

---

## 4. Toast Notifications & Alerts
- **Library**: `sonner` is configured globally at the root layout level, providing non-blocking alerts at the screen's bottom-right corner.
- **Uniform feedback**: All async tasks (e.g., "Product added successfully", "Insufficient stock", or "Unauthorized") use cohesive visual themes depending on status.
- **Destructive Confirmations**: Confirming hard deletes uses the shared `ConfirmDialog` component, displaying a descriptive warning, blocking standard interactions, and managing asynchronous execution spinners until the backend returns status.

---

## 5. WebApp MVC Component Rendering
- **Grid Patterns**: Constructed using standard Razor layouts combined with server-rendered columns and client-side AJAX requests using jQuery for client interaction.
- **PDF Composition**: The Invoice templates in `Unity_Inventory.WebApp` are styled as clean, high-contrast, black-and-white print sheets using standard CSS print margins, optimizing them for wkhtmltopdf-based file creation.
