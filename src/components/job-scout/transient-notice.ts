/** Notices that render as toasts instead of the inline status strip. */
const TRANSIENT_EXACT = new Set([
  "Saved to your library",
  "Marked as applied",
  "Removed permanently",
  "Profile renamed",
  "Skills updated · re-ranking search",
  "Default search updated",
]);

export function isTransientNotice(notice: string): boolean {
  if (TRANSIENT_EXACT.has(notice)) return true;
  if (/^Profile ".+" created$/.test(notice)) return true;
  return false;
}
