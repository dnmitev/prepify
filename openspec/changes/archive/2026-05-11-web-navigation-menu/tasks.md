## 1. Shell and navigation component

- [x] 1.1 Add a client **`AppNav`** (or equivalent) under `apps/web` with `next/link` entries for `/`, `/exam`, `/history`, `/admin/jobs`, and `/experimental/webllm`; set **`data-testid="app-nav"`** on the `<nav>`; use **`usePathname()`** to apply **`aria-current="page"`** on the active link. Add an accessible label (e.g. `aria-label` on `nav`).
- [x] 1.2 Update **`apps/web/app/layout.tsx`** to render a header (brand/title + `AppNav`) above **`<main className="app-main">`** wrapping `{children}`. Keep metadata and `globals.css` import.
- [x] 1.3 Extend **`apps/web/app/globals.css`** with styles for **`.app-header`**, **`.app-nav`**, and **`.app-main`** (flex, wrap, gap, border, padding) consistent with the existing dark theme.

## 2. Page cleanup (optional but recommended)

- [x] 2.1 Trim redundant duplicate navigation from **`page.tsx`** (home) where links are now in the global nav—keep any copy that adds value (e.g. contextual “In progress” block). Avoid removing unique content.

## 3. Verification

- [x] 3.1 Run **`npx eslint`** on touched web files and fix new issues; run **`npm run build -w @prepify/web`**.
- [x] 3.2 Update or extend **`apps/web/e2e/smoke.spec.ts`** (or add a small spec) to assert **`app-nav`** is visible on `/` and at least one other route (e.g. `/history`). Run **`npm run test:e2e -w @prepify/web`** when the stack is up, or note in PR if skipped locally.
- [x] 3.3 Run **`npm test --workspaces --if-present`** and **`npm run build`** from repo root before merge; mark tasks `[x]` only after checks pass.
