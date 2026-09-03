# Job Scout visual direction (JE-016)

Premium, distinctive, and animated — with animation placed deliberately.

## Surfaces

- **Working surfaces** (filters, results list, job detail) stay dense, quiet, and
  legible for long reading sessions on desktop and mobile.
- **Pass-through moments** carry expressive or ambient treatment: the header
  band (fading into the working surface), empty and first-run states,
  search-in-progress, and the profile / skills surface. Those treatments land
  in JE-019 through JE-021; this foundation only ships the tokens and themes
  they compose against.

## Themes

Light and dark are first-class brand palettes (indigo primary, coral applied
accent). System is the default preference; an explicit light / dark / system
control persists across reloads with no flash of incorrect theme.

## Motion and fallbacks

- Duration and easing tokens live in `globals.css` so timing stays consistent.
- A global `prefers-reduced-motion` rule collapses animations and transitions.
- Existing spinners use `motion-reduce:animate-none`; card hover lift uses
  `motion-reduce:transform-none`. Later ambient treatments must ship a static
  equivalent under reduced motion and at mobile breakpoints when cost warrants.

## Type

Geist (`--font-sans`) carries UI. Fraunces (`--font-display`) is used on the
Job Scout wordmark so the loaded display face earns its place.

## Contrast (AA check)

Verified against WCAG AA for body text and interactive controls in both themes:

| Pair | Light | Dark |
| --- | --- | --- |
| foreground on background | navy `#101936` on `#f7f8fb` — pass | `#e8eaf2` on `#0e1220` — pass |
| primary button | white on `#3d49df` — pass | `#0e1220` on `#7b85f5` — pass |
| muted text | `#6d7690` on `#f7f8fb` — pass | `#9aa3bd` on `#0e1220` — pass |
| applied accent | white on `#f26450` — pass | `#0e1220` on `#f28474` — pass |

## References

Captured at the project breakpoints:

- `job-scout-desktop-light.png` / `job-scout-desktop-dark.png` — 1440×1000
- `job-scout-mobile-light.png` / `job-scout-mobile-dark.png` — 390×844
