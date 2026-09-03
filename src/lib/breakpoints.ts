/**
 * Must match the `xl:` Tailwind breakpoint (1280px) used in
 * `components/job-scout/index.tsx` to switch between the mobile/tablet
 * detail sheet and the persistent desktop detail pane. Tailwind's CSS
 * breakpoint isn't introspectable from JS, so this is kept in sync by
 * hand — update both if the `xl` breakpoint ever changes.
 */
export const DETAIL_PANE_BREAKPOINT_PX = 1280;
