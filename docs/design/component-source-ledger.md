# Component source ledger

Verified sources for every Batch 05 UI need (JE-018 through JE-021). JE-018
installs from this ledger; no Batch 05 task may install a component that is not
listed here.

**Install runner:** `pnpm dlx shadcn@latest` (or `pnpm exec shadcn` with the
pinned local CLI). Commands below use `pnpm dlx shadcn@latest add …`.

**Project base:** `style: "base-nova"` / `@base-ui/react`. `@shadcn` items
install as Base UI. Premium items marked Radix or neither must be migrated or
adapted before use (see `.agents/skills/migrate-radix-to-base/`).

**License note:** Registry item JSON rarely embeds a license field. Values below
come from the upstream project's published license (MIT unless noted). Items
whose license does not permit use here are omitted.

## Authoring conditions

| Condition | Status |
| --- | --- |
| 21st.dev MCP reachable | **No** — `TWENTY_FIRST_API_KEY` unset. All needs below were resolved without 21st.dev. |
| `@cult-ui` search/view | **Rate-limited (HTTP 429)** during authoring. Namespace remains configured with the official URL template; **no ledger row sources from `@cult-ui`** until an item can be verified. Re-verify before JE-018 if Cult UI is desired. |
| Other namespaces | `@magicui`, `@aceternity`, `@kokonutui`, `@reactbits`, and `@shadcn` resolved via the pinned CLI. |

---

## JE-018 — Primitives to install

| UI need | Add target | Install command | License | Dependencies | Base / Radix | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| Card (job card, source card, pane chrome) | `@shadcn/card` | `pnpm dlx shadcn@latest add @shadcn/card` | MIT | none | Base UI (`base-nova`) | Fits panel and card shapes; premium cards add motion/hardcoded colors without helping density. |
| Alert (status banners) | `@shadcn/alert` | `pnpm dlx shadcn@latest add @shadcn/alert` | MIT | none | Base UI (`base-nova`) | Direct replacement for six near-duplicate banners; variants map to JE-016 semantic tokens. |
| Label | `@shadcn/label` | `pnpm dlx shadcn@latest add @shadcn/label` | MIT | none | Base UI (`base-nova`) | Required by field; already the project pattern. |
| Field, field-description, field-error | `@shadcn/field` | `pnpm dlx shadcn@latest add @shadcn/field` | MIT | registry: `label`, `separator` | Base UI (`base-nova`) | Single package covers description and error slots used in filters and profile forms. |
| Dialog (create/rename/skills forms) | `@shadcn/dialog` | `pnpm dlx shadcn@latest add @shadcn/dialog` | MIT | registry: `button` | Base UI | Correct primitive for non-destructive forms; keep `alert-dialog` for delete confirm. |
| Empty state shell | `@shadcn/empty` | `pnpm dlx shadcn@latest add @shadcn/empty` | MIT | none | Base UI (`base-nova`) | Spec empty primitive; expressive wrappers listed under JE-020/021. |
| Toast (transient outcomes) | `@shadcn/toast` | `pnpm dlx shadcn@latest add @shadcn/toast` | MIT | `@base-ui/react`; registry: `button` | Base UI | Base UI projects use `toast`, not `sonner` (shadcn skill). |
| Pagination | `@shadcn/pagination` | `pnpm dlx shadcn@latest add @shadcn/pagination` | MIT | registry: `button` | Base UI (`base-nova`) | Matches design reference; wire to existing search page contract in JE-018/020. |
| Spinner | `@shadcn/spinner` | `pnpm dlx shadcn@latest add @shadcn/spinner` | MIT | none | Base UI (`base-nova`) | Replaces hand-drawn loading indicators; composes with Button `data-icon`. |
| Input group (search with leading icon) | `@shadcn/input-group` | `pnpm dlx shadcn@latest add @shadcn/input-group` | MIT | registry: `button`, `input`, `textarea` | Base UI (`base-nova`) | Deduplicates keyword/location search-input pattern. |
| Popover | `@shadcn/popover` | `pnpm dlx shadcn@latest add @shadcn/popover` | MIT | none | Base UI | Needed for surface tasks (theme/menu overflow, filter helpers). |
| Command | `@shadcn/command` | `pnpm dlx shadcn@latest add @shadcn/command` | MIT | `cmdk`; registry: `dialog`, `input-group` | neither (cmdk) | Combobox/search lists for profile and filter pickers; adapt to Base UI patterns on install. |
| Slider (minimum salary) | `@shadcn/slider` | `pnpm dlx shadcn@latest add @shadcn/slider` | MIT | none | Base UI | JE-020 may replace four-option select; values must still URL-round-trip. |
| Accordion (collapsible filter groups) | `@shadcn/accordion` | `pnpm dlx shadcn@latest add @shadcn/accordion` | MIT | none | Base UI | Optional filter density without custom disclosure markup. |
| Toggle group (employment/seniority) | `@shadcn/toggle-group` | `pnpm dlx shadcn@latest add @shadcn/toggle-group` | MIT | registry: `toggle` | Base UI | Better than checkbox rows for small exclusive/multi option sets; pulls `toggle`. |
| Switch | `@shadcn/switch` | `pnpm dlx shadcn@latest add @shadcn/switch` | MIT | none | Base UI | Needed for boolean prefs/surfaces without inventing a control. |

### Already installed `@shadcn` (record only — do not re-add unless missing)

| UI need | Add target | Install command | License | Dependencies | Base / Radix | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| Tabs (job detail; view nav candidate) | `@shadcn/tabs` | already in `src/components/ui/tabs.tsx` | MIT | none | Base UI | Adopt for real detail tabs; reuse for Discover/Saved/Applied if preferred over navigation-menu. |
| Skeleton | `@shadcn/skeleton` | already installed | MIT | none | Base UI | Replace bare “Loading roles…” string. |
| Separator | `@shadcn/separator` | already installed | MIT | none | Base UI | Replace `border-y` / `border-t` dividers. |
| Scroll area | `@shadcn/scroll-area` | already installed | MIT | none | Base UI | Adopt in panes or remove in JE-018 — must not stay unused. |
| Tooltip | `@shadcn/tooltip` | already installed | MIT | none | Base UI | Wire provider + labels for icon-only controls, or remove. |
| Button | `@shadcn/button` | already installed | MIT | `@base-ui/react` | Base UI | Existing primary control. |
| Badge (skill chips, attribution) | `@shadcn/badge` | already installed | MIT | none | Base UI | Matched-skill chips and provider counts. |
| Checkbox | `@shadcn/checkbox` | already installed | MIT | none | Base UI | Filter groups / providers. |
| Select | `@shadcn/select` | already installed | MIT | none | Base UI | Remaining selects (e.g. salary until slider lands). |
| Sheet | `@shadcn/sheet` | already installed | MIT | none | Base UI | Mobile filters and detail. |
| Progress | `@shadcn/progress` | already installed | MIT | none | Base UI | Search progress bar; keep under expressive overlay. |
| Input | `@shadcn/input` | already installed | MIT | none | Base UI | Used inside input-group. |
| Dropdown menu | `@shadcn/dropdown-menu` | already installed | MIT | none | Base UI | Theme control and overflow menus. |
| Avatar | `@shadcn/avatar` | already installed | MIT | none | Base UI | Optional profile affordances. |
| Alert dialog (delete confirm) | `@shadcn/alert-dialog` | already installed | MIT | none | Base UI | Keep for destructive confirm only. |

---

## JE-019 — Application shell and theme

| UI need | Add target | Install command | License | Dependencies | Base / Radix | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| Header wordmark / logo mark | **custom** | n/a — compose in app | n/a | n/a | n/a | Brand-specific mark; no registry item matches Job Scout identity. |
| Navigation (Discover / Saved / Applied) | `@shadcn/tabs` (existing) or `@shadcn/navigation-menu` | existing tabs, or `pnpm dlx shadcn@latest add @shadcn/navigation-menu` | MIT | none | Base UI | Prefer existing tabs for three views; navigation-menu only if IA needs nested links. Verified `@kokonutui/smooth-tab` as animated alternative — deferred to avoid motion on a primary working control. |
| Theme control (light / dark / system) | **custom** over `@shadcn/dropdown-menu` (existing) | n/a | MIT (menu) | none | Base UI | Must expose three states with labelled icon control; `@kokonutui/switch-button` is binary light/dark only. |
| Ambient header-band treatment | `@magicui/flickering-grid` | `pnpm dlx shadcn@latest add @magicui/flickering-grid` | MIT | none | neither (custom SVG React) | Calm, token-tintable SVG grid confined to the header; lighter than `@reactbits/Aurora-TS-TW` (`ogl`) or `@reactbits/Silk-TS-TW` (three.js). Static fallback under `prefers-reduced-motion`. |
| Pane chrome / surface | `@shadcn/card` | (see JE-018) | MIT | none | Base UI | Same card primitive for filter rail, results column, detail pane. |

**Verified alternatives not chosen for ambient:** `@magicui/particles`, `@magicui/dot-pattern`, `@aceternity/background-beams` (heavier motion), `@reactbits/Aurora-TS-TW`, `@reactbits/Silk-TS-TW`.

---

## JE-020 — Discovery surfaces

| UI need | Add target | Install command | License | Dependencies | Base / Radix | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| Job card composition | `@shadcn/card` + `@shadcn/badge` | (see above; badge already installed) | MIT | none | Base UI | Composition, not a premium block; keeps density and JE-014 chip contract. |
| Company logo + letter-tile fallback | **custom** | n/a — shared component; configure `next.config.ts` images in JE-020 | n/a | `next/image` | n/a | Provider logo URLs are arbitrary hosts; letter-tile fallback is app-specific. No registry item fits. |
| Results skeletons | `@shadcn/skeleton` (existing) | already installed | MIT | none | Base UI | Size to redesigned card; no premium skeleton needed. |
| Pagination presentation | `@shadcn/pagination` | (see JE-018) | MIT | registry: `button` | Base UI | Present in results list against existing page contract. |
| Empty / error expressive treatment (offline, no results, no saved) | `@shadcn/empty` + `@magicui/blur-fade` | `pnpm dlx shadcn@latest add @shadcn/empty @magicui/blur-fade` | MIT | `motion` (blur-fade) | empty: Base UI; blur-fade: neither | Empty shell for structure; blur-fade for pass-through entrance with reduced-motion skip. Same pairing for JE-021 library empties. |

**Verified alternative for empty motion:** `@reactbits/BlurText-TS-TW` (`motion`) — title-only; prefer blur-fade wrapping the whole empty block.

---

## JE-021 — Detail, library, and status

| UI need | Add target | Install command | License | Dependencies | Base / Radix | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| Job detail tabs | `@shadcn/tabs` (existing) | already installed | MIT | none | Base UI | Replace faked tab bar; divide content across real tabs. |
| Shared company logo / letter tile | **custom** (same as JE-020) | n/a | n/a | n/a | n/a | One component shared by card and detail. |
| Source list cards | `@shadcn/card` | (see JE-018) | MIT | none | Base UI | Rebuild source links on card; keep accessible names and primary designation. |
| Status banners (partial, warning, expired, offline, validation, failed) | `@shadcn/alert` | (see JE-018) | MIT | none | Base UI | One component with variants on semantic tokens. |
| Search-in-progress expressive treatment | `@kokonutui/ai-loading` (+ existing `@shadcn/progress`) | `pnpm dlx shadcn@latest add @kokonutui/ai-loading` | MIT (Kokonut UI) | `motion` | neither | Cycles status lines suitable for per-provider progress; keep `progress` and `search-notice` strings. Reduced-motion falls back to progress + text. |
| Skills tag input | **custom** | n/a — rebuild existing JE-014 editor on field/badge primitives | n/a | n/a | n/a | JE-014 contract (order, caps, keyboard chip removal, 422 text) is app-specific; no verified registry tag-input fit in Magic UI / Kokonut / React Bits / Aceternity. |
| Profile / skills surface expressive treatment | `@magicui/border-beam` | `pnpm dlx shadcn@latest add @magicui/border-beam` | MIT | `motion` | neither | Restrained pass-through accent on dialog/card; static under reduced motion. |
| Saved / applied empty states | `@shadcn/empty` + `@magicui/blur-fade` | (same as JE-020) | MIT | `motion` | as above | One empty treatment shared with discovery empties. |

**Verified alternatives not chosen for search-in-progress:** `@magicui/animated-circular-progress-bar` (loses linear multi-provider metaphor), `@reactbits/Stepper-TS-TW` (wizard-shaped), `@magicui/text-animate` (text-only).

---

## Install batch reference (JE-018+)

Unique add targets not already on disk:

```bash
pnpm dlx shadcn@latest add \
  @shadcn/card \
  @shadcn/alert \
  @shadcn/label \
  @shadcn/field \
  @shadcn/dialog \
  @shadcn/empty \
  @shadcn/toast \
  @shadcn/pagination \
  @shadcn/spinner \
  @shadcn/input-group \
  @shadcn/popover \
  @shadcn/command \
  @shadcn/slider \
  @shadcn/accordion \
  @shadcn/toggle-group \
  @shadcn/switch \
  @magicui/flickering-grid \
  @magicui/blur-fade \
  @magicui/border-beam \
  @kokonutui/ai-loading
```

Optional if tabs prove insufficient for shell nav:

```bash
pnpm dlx shadcn@latest add @shadcn/navigation-menu
```

Do **not** install from this ledger until JE-016 and JE-017 are done (JE-018 ownership).

---

## Gaps / follow-ups

1. **21st.dev:** Supply `TWENTY_FIRST_API_KEY` to unlock the MCP; re-scan for tag-input or empty treatments if desired, then extend this ledger with verified rows.
2. **`@cult-ui`:** Re-run `pnpm exec shadcn search @cult-ui` after the 429 clears; add verified rows only then.
3. **Custom rows** (wordmark, theme control, company logo, tag input) are intentional — not placeholders for a missing registry hunt.
