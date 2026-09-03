---
name: job-scout-ui
description: Build or review Job Scout discovery and library UI. Use for React components, layouts, filters, job cards, job details, responsive behavior, or visual QA.
---

# Job Scout UI

Before custom UI, consult `docs/design/component-source-ledger.md` for the resolved source of every Batch 05 need. Prefer existing project components, then install only ledger-listed add targets from the configured registries: `@shadcn` (built-in), `@magicui`, `@aceternity`, `@cult-ui`, `@kokonutui`, and `@reactbits`. 21st.dev is available through the `21st-dev` MCP when `TWENTY_FIRST_API_KEY` is set; without the key, treat it as unavailable and continue with the other registries. When a genuinely new need appears, extend the ledger with a verified row before installing. Custom code should be the smallest job-specific composition.

Use `docs/design/job-scout-desktop-light.png`, `docs/design/job-scout-desktop-dark.png`, `docs/design/job-scout-mobile-light.png`, and `docs/design/job-scout-mobile-dark.png` as visual references (see `docs/design/visual-direction.md`). Preserve the calm three-pane desktop layout and card-first mobile layout: cool canvas, card surfaces, deep navy type, indigo primary, coral only for applied actions, restrained shadows, 14px radii. Working surfaces stay dense and quiet; expressive motion belongs only at pass-through moments.

Requirements:

- Profile picker persists selection locally; no login UI.
- Discover, Saved, and Applied are first-class views.
- Search shows progressive provider status, partial results, warnings, and exact totals only when complete.
- Filters are URL-addressable and can replace the profile's default search.
- Desktop keeps filters, list, and detail visible. Mobile uses a filter sheet and full-height detail sheet.
- Unsaved job detail is resolved by `search_id` plus provider identity; saved snapshots remain available if the provider removes a listing.
- All icon-only controls need labels/tooltips. Support keyboard operation, focus visibility, reduced motion, loading, empty, error, and offline/API-unavailable states.
- Verify at 1440x1000 and 390x844 with Playwright and compare both screenshots to the references before declaring completion.
