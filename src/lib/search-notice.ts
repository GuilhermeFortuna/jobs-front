import type { SearchPage } from "@/lib/api";
import { failedProviderNames, formatProviderName } from "@/lib/providers";

export type StatusKind =
  | "idle"
  | "loading"
  | "partial"
  | "complete"
  | "failed"
  | "offline"
  | "expired"
  | "empty"
  | "validation";

export function statusKindFromPage(
  page: SearchPage | null,
  offline: boolean,
  expired: boolean,
): StatusKind {
  if (offline) return "offline";
  if (expired) return "expired";
  if (!page) return "idle";
  if (page.status === "failed") return "failed";
  if (page.is_complete && page.items.length === 0) return "empty";
  if (page.is_complete && page.is_partial) return "partial";
  if (page.is_complete) return "complete";
  return "loading";
}

export function buildNotice(page: SearchPage): string {
  if (page.status === "failed") {
    return page.warnings[0] ?? "Search stopped early";
  }

  if (page.is_complete && page.is_partial) {
    const failed = failedProviderNames(page.providers);
    const failedLabel =
      failed.length === 1
        ? `${failed[0]} unavailable`
        : `${failed.join(", ")} unavailable`;
    return `Search partially complete · ${page.total ?? 0} roles · ${failedLabel}`;
  }

  if (page.is_complete) {
    return `Search complete · ${page.total ?? 0} matching roles`;
  }

  const active = page.providers
    .filter((entry) => entry.status !== "failed")
    .map((entry) => formatProviderName(entry.provider));
  if (active.length) {
    return `Searching ${active.join(", ")}…`;
  }
  return "Searching providers…";
}

export function announcementKey(page: SearchPage): string {
  const kind = statusKindFromPage(page, false, false);
  const failed = failedProviderNames(page.providers).join(",");
  const total = page.is_complete ? String(page.total ?? 0) : "loading";
  return `${kind}:${failed}:${total}`;
}
