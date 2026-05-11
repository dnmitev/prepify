## Why

The web app currently renders each page as an isolated **card** with ad-hoc links at the bottom or inline. Users must rely on **in-page links** to move between home, practice, history, and admin flows—there is **no persistent shell**, which hurts discoverability and feels unfinished. A small **global navigation** (header/menu) improves orientation and aligns with how learners expect multi-section apps to behave.

## What Changes

- Add a **persistent top navigation** (or equivalent app shell) in the **Next.js root layout** so every route shares the same entry points.
- Include **primary destinations**: Home, Practice (exam intro), Attempt history, Admin jobs (dev), and Experimental (as today—clearly secondary).
- Use **accessible** patterns: landmark (`<nav>`), visible focus, link text that matches destination; optional **current page** indication for clarity.
- **Responsive-friendly** layout for narrow viewports (wrap, or compact menu—see design) without blocking mobile use.
- **No API or backend changes**; optional **Playwright** touch-up so smoke tests still pass with the new chrome.

## Capabilities

### New Capabilities

- `web-navigation`: Product requirements for a shared navigation/menu across the Prepify web app (structure, destinations, accessibility expectations).

### Modified Capabilities

_(none — testing detail stays in tasks; no normative change to automated-testing spec required for v1.)_

## Impact

- **`apps/web/app/layout.tsx`** — wrap `children` with a shell that includes navigation.
- **`apps/web`** — likely new component under `app/` or `components/` (project convention: follow existing colocation).
- **`apps/web/app/globals.css`** — optional spacing/typography for header and main content region.
- **`apps/web/e2e/`** — adjust selectors if headings/layout shift (e.g. smoke test still finds Prepify).
