# Job Scout visual direction (JE-022)

Ink-and-acid identity: dark-first neutrals, one citron accent, self-hosted type.

## Surfaces

- **Working surfaces** (filters, results list, job detail) stay dense, quiet, and
  legible for long reading sessions on desktop and mobile.
- **Pass-through moments** carry expressive or ambient treatment: the header
  band, empty and first-run states, search-in-progress, and the profile /
  skills surface. Those treatments compose against these tokens.

Surfaces are **ink** — true neutral near-black with no hue tint (every dark
neutral is achromatic: `r == g == b`). Light is derived as warm paper, not a
blue-tinted navy inverse.

### Elevation ramp

Three levels, and the floor is what the shell actually paints:

| Token | Dark | Light | Used by |
| --- | --- | --- | --- |
| `--background` | `#0a0a0a` | `#f6f5f1` | App floor — header, filter rail, results column, detail pane, footer |
| `--surface` | `#0f0f0f` | `#faf8f4` | Low raise — search status block, detail source cards, profile trigger |
| `--card` | `#141414` | `#fffcf7` | Floating — job cards, popovers, dialogs |

The shell panes sit on the floor and are separated by `--border`, not by
elevation. Only genuinely floating things lift off it, so the near-black reads
as the dominant surface rather than as a sliver behind opaque panes.

## Themes

Dark is authored first. Light is derived from it. Both themes share the same
acid citron primary fill (`#c6f24a` with near-black text). Emphasis is expressed
by **weight**, not by a second hue:

| Weight | Use |
| --- | --- |
| Solid citron fill, near-black text | Primary action (search, confirm, submit) |
| Outlined citron, citron text | Applied state |
| Neutral raised surface | Secondary action (save, cancel) |

Coral is removed. Success green is reserved for confirmations — salary and
numeric data use the neutral `--data-*` pair. Light mode defines
`--primary-emphasis` (deeper olive-citron) for citron-as-text; citron fill stays
`#c6f24a` in both themes.

System is the default preference; an explicit light / dark / system control
persists across reloads with no flash of incorrect theme.

## Motion and fallbacks

- Duration and easing tokens live in `globals.css` so timing stays consistent.
- A global `prefers-reduced-motion` rule collapses animations and transitions.
- Ambient and expressive treatments ship a static equivalent under reduced
  motion and at mobile breakpoints when cost warrants.

## Type

General Sans (`--font-sans`) carries UI. Cabinet Grotesk (`--font-display`) is
used on the Job Scout wordmark. Both load through `next/font/local` from
`woff2` files under `src/app/fonts/` (Fontshare, ITF Free Font Licence). No
runtime request reaches a font CDN.

## Contrast (AA check)

Verified against WCAG AA in both themes. Ratios are quoted against the **worst
case surface each pair actually renders on** — `--card` in dark, `--background`
in light — not against the floor token alone.

| Pair | Light | Dark |
| --- | --- | --- |
| foreground | `#141413` on `#f6f5f1` — 16.9:1 pass | `#ededed` on `#141414` — 15.7:1 pass |
| primary button (fill) | `#161c05` on `#c6f24a` — 13.5:1 pass | `#161c05` on `#c6f24a` — 13.5:1 pass |
| muted text | `#6f6d66` on `#f6f5f1` — 4.7:1 pass | `#8f8f8f` on `#141414` — 5.7:1 pass |
| applied outline / text | `#4f6a10` on `#f6f5f1` — 5.7:1 pass | `#c6f24a` on `#141414` — 14.2:1 pass |
| salary / data | `#5c574e` on `#f6f5f1` — 6.6:1 pass | `#d4d4d4` on `#141414` — 12.4:1 pass |
| light `--primary-emphasis` | `#4f6a10` on `#f6f5f1` — 5.7:1 pass | n/a (aliases primary) |

On the floor (`#0a0a0a`) every dark pair gains roughly 1 point: foreground
16.9:1, muted 6.1:1, citron 15.3:1.

Citron `#c6f24a` as text on light paper fails AA (~1.4:1); light mode must use
`--primary-emphasis` for citron-as-text and icons.

## References

Captured at the project breakpoints:

- `job-scout-desktop-light.png` / `job-scout-desktop-dark.png` — 1440×1000
- `job-scout-mobile-light.png` / `job-scout-mobile-dark.png` — 390×844
