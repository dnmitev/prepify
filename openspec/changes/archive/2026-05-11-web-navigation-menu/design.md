## Context

`apps/web` uses the App Router with a minimal `layout.tsx` (metadata + `body` only). Each page (`/`, `/exam`, `/history`, `/attempt/...`, `/admin/jobs`, `/experimental/webllm`) renders its own `.card` and duplicates navigation links in prose or lists. There is no shared chrome.

## Goals / Non-Goals

**Goals:**

- Introduce a **lightweight app shell**: branded header + horizontal **`<nav>`** with `next/link` targets for primary routes.
- Keep **keyboard and screen-reader** basics: skip cluttering the DOM; use a single landmark navigation; sufficient contrast with existing theme.
- **Narrow screens**: links **wrap** or use a single row with horizontal scroll (CSS `flex-wrap` + `gap`)—avoid heavy JS hamburger for v1 unless trivial.
- **Active route** (optional v1): use `usePathname()` in a small client `NavBar` component, or `aria-current="page"` on the matching link.

**Non-Goals:**

- User accounts, role-based menu hiding, or server-driven nav config.
- Redesigning page interiors (cards, attempt UI) beyond spacing under the header.
- i18n or configurable nav from CMS.

## Decisions

1. **Client vs server nav highlighting**  
   - **Choice:** Small **`"use client"`** component for links + `usePathname()` to set `aria-current="page"`.  
   - **Rationale:** Simplest accurate active state in App Router without middleware hacks.  
   - **Alternative:** Server-only nav without active state (rejected for UX clarity).

2. **Where to mount the shell**  
   - **Choice:** **`app/layout.tsx`** wraps `{children}` in `<header>` + `<main>`.  
   - **Rationale:** One place; all routes get nav automatically.  
   - **Alternative:** Template per segment (rejected—duplication).

3. **Link set (v1)**  
   - **Home** `/`  
   - **Practice** `/exam`  
   - **History** `/history`  
   - **Admin jobs** `/admin/jobs`  
   - **Experimental** `/experimental/webllm`  
   - **Rationale:** Matches current IA; labels short and scannable.

4. **Styling**  
   - **Choice:** Extend **`globals.css`** with `.app-header`, `.app-nav`, `.app-main` (padding, border-bottom, flex). Reuse existing colors.  
   - **Rationale:** No new UI library; consistent with project.

## Risks / Trade-offs

- **[Risk]** Client `NavBar` adds a tiny JS bundle to every page → **Mitigation:** minimal component; no icons library.  
- **[Risk]** E2E selectors break if heading moves → **Mitigation:** add **`data-testid="app-nav"`** on `<nav>`; update smoke spec if needed.

## Migration Plan

- Ship layout change in one PR; rollback = revert layout + CSS.  
- No data migration.

## Open Questions

- Should **Attempt** routes hide secondary links to reduce clutter? (v1: **no**—same nav everywhere for consistency.)
