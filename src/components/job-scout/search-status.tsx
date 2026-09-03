"use client";

import {
  AlertTriangle,
  CheckCircle2,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";

import { Progress } from "@/components/ui/progress";
import type { StatusKind } from "@/hooks/use-job-scout";
import type { ProviderSearchStatus } from "@/lib/api";
import { formatProviderName } from "@/lib/providers";
import { Button } from "@/components/ui/button";

type SearchStatusProps = {
  view: "discover" | "saved" | "applied";
  loading: boolean;
  notice: string;
  liveAnnouncement: string;
  checked: number;
  progress: number;
  total: number | null;
  warnings: string[];
  providerStatuses: ProviderSearchStatus[];
  statusKind: StatusKind;
  searchExpired: boolean;
  onRetry?: () => void;
  onRefresh?: () => void;
  onRunSearch?: () => void;
};

function ProviderStatusIcon({
  status,
}: {
  status: ProviderSearchStatus["status"];
}) {
  if (status === "loading") {
    return (
      <LoaderCircle
        className="size-3.5 animate-spin text-[#3d49df] motion-reduce:animate-none"
        aria-hidden="true"
      />
    );
  }
  if (status === "complete") {
    return (
      <CheckCircle2 className="size-3.5 text-[#2f8a4d]" aria-hidden="true" />
    );
  }
  return <XCircle className="size-3.5 text-[#c44a38]" aria-hidden="true" />;
}

export function SearchStatus({
  view,
  loading,
  notice,
  liveAnnouncement,
  checked,
  progress,
  total,
  warnings,
  providerStatuses,
  statusKind,
  searchExpired,
  onRetry,
  onRefresh,
  onRunSearch,
}: SearchStatusProps) {
  const failedProviders = providerStatuses.filter(
    (entry) => entry.status === "failed",
  );

  return (
    <div className="border-b bg-white px-5 py-5">
      <div className="sr-only" aria-live="polite">
        {liveAnnouncement}
      </div>

      {statusKind === "partial" && view === "discover" && (
        <div
          className="mb-3 flex items-start gap-2 rounded-xl border border-[#f0dcc8] bg-[#fff8f2] px-3 py-2 text-sm text-[#8a5a32]"
          role="status"
        >
          <AlertTriangle
            className="mt-0.5 size-4 shrink-0"
            aria-hidden="true"
          />
          <span>
            Search partially complete
            {failedProviders.length > 0 && (
              <>
                {" "}
                ·{" "}
                {failedProviders
                  .map((entry) => formatProviderName(entry.provider))
                  .join(", ")}{" "}
                unavailable
              </>
            )}
            {total !== null && <> · {total} matching roles</>}
          </span>
        </div>
      )}

      {warnings.length > 0 &&
        view === "discover" &&
        statusKind !== "partial" &&
        statusKind !== "failed" && (
          <div
            className="mb-3 flex items-start gap-2 rounded-xl border border-[#f0dcc8] bg-[#fff8f2] px-3 py-2 text-sm text-[#8a5a32]"
            role="status"
          >
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <span>{warnings[0]}</span>
          </div>
        )}

      {searchExpired && view === "discover" && (
        <div
          className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-[#f0d4d0] bg-[#fff5f4] px-3 py-2 text-sm text-[#8a4038]"
          role="alert"
        >
          <span>Search expired · start a new search to save roles</span>
          {onRunSearch && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-lg"
              onClick={onRunSearch}
            >
              Run search
            </Button>
          )}
        </div>
      )}

      {statusKind === "offline" && (
        <div
          className="mb-3 flex flex-wrap items-center gap-2 rounded-xl border border-[#dfe2eb] bg-[#fafbfc] px-3 py-2 text-sm text-[#56617d]"
          role="alert"
        >
          <span>{notice}</span>
          {onRetry && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-lg"
              onClick={onRetry}
            >
              <RefreshCw className="size-3.5" />
              Retry
            </Button>
          )}
        </div>
      )}

      {statusKind === "validation" && (
        <div
          className="mb-3 rounded-xl border border-[#f0d4d0] bg-[#fff5f4] px-3 py-2 text-sm text-[#8a4038]"
          role="alert"
        >
          {notice}
        </div>
      )}

      {statusKind === "failed" && view === "discover" && (
        <div
          className="mb-3 rounded-xl border border-[#f0d4d0] bg-[#fff5f4] px-3 py-2 text-sm text-[#8a4038]"
          role="alert"
        >
          {notice}
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-[#56617d]">
        {loading ? (
          <LoaderCircle
            className="size-4 animate-spin text-[#3d49df] motion-reduce:animate-none"
            aria-hidden="true"
          />
        ) : (
          <Sparkles className="size-4 text-[#3d49df]" aria-hidden="true" />
        )}
        <span className="min-w-0 break-words">{notice}</span>
        {checked > 0 && view === "discover" && (
          <span className="ml-auto shrink-0 tabular-nums">
            {checked.toLocaleString()} checked
          </span>
        )}
        {view === "discover" && onRefresh && (
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto h-8 rounded-lg text-[#3d49df]"
            onClick={onRefresh}
            aria-label="Refresh default search"
          >
            <RefreshCw className="size-3.5" />
          </Button>
        )}
      </div>

      {view === "discover" && providerStatuses.length > 0 && (
        <ul className="mt-3 space-y-2" aria-label="Provider search status">
          {providerStatuses.map((entry) => (
            <li
              key={entry.provider}
              className="flex min-w-0 items-center gap-2 text-xs text-[#5f6982]"
              role="status"
            >
              <ProviderStatusIcon status={entry.status} />
              <span className="min-w-0 shrink break-words">
                {formatProviderName(entry.provider)}
              </span>
              <span className="ml-auto shrink-0 tabular-nums">
                {entry.checked_count > 0
                  ? `${entry.checked_count.toLocaleString()} checked`
                  : entry.status === "failed"
                    ? "Unavailable"
                    : `${Math.round(entry.progress * 100)}%`}
              </span>
            </li>
          ))}
        </ul>
      )}

      {view === "discover" && (
        <Progress
          value={progress * 100}
          className="mt-3 [&_[data-slot=progress-indicator]]:bg-[#3d49df]"
          aria-label="Search progress"
        />
      )}
    </div>
  );
}
