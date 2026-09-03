"use client";

import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";

import { Alert, AlertAction, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { StatusKind } from "@/hooks/use-job-scout";
import type { ProviderSearchStatus } from "@/lib/api";
import { formatProviderName } from "@/lib/providers";
import { isTransientNotice } from "@/components/job-scout/transient-notice";

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
      <Spinner
        className="size-3.5 text-primary motion-reduce:animate-none"
        aria-hidden="true"
      />
    );
  }
  if (status === "complete") {
    return (
      <CheckCircle2 className="size-3.5 text-success" aria-hidden="true" />
    );
  }
  return <XCircle className="size-3.5 text-destructive" aria-hidden="true" />;
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
  const stripNotice = isTransientNotice(notice) ? "" : notice;

  return (
    <div className="border-b bg-card px-5 py-5" data-testid="search-status">
      <div className="sr-only" aria-live="polite">
        {liveAnnouncement}
      </div>

      {statusKind === "partial" && view === "discover" && (
        <Alert variant="warning" role="status" className="mb-3 rounded-xl">
          <AlertTriangle aria-hidden="true" />
          <AlertDescription>
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
          </AlertDescription>
        </Alert>
      )}

      {warnings.length > 0 &&
        view === "discover" &&
        statusKind !== "partial" &&
        statusKind !== "failed" && (
          <Alert variant="warning" role="status" className="mb-3 rounded-xl">
            <AlertTriangle aria-hidden="true" />
            <AlertDescription>{warnings[0]}</AlertDescription>
          </Alert>
        )}

      {searchExpired && view === "discover" && (
        <Alert variant="destructive" className="mb-3 rounded-xl">
          <AlertDescription>
            Search expired · start a new search to save roles
          </AlertDescription>
          {onRunSearch && (
            <AlertAction>
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg"
                onClick={onRunSearch}
              >
                Run search
              </Button>
            </AlertAction>
          )}
        </Alert>
      )}

      {statusKind === "offline" && (
        <Alert variant="info" className="mb-3 rounded-xl">
          <AlertDescription>{notice}</AlertDescription>
          {onRetry && (
            <AlertAction>
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-lg"
                onClick={onRetry}
              >
                <RefreshCw className="size-3.5" />
                Retry
              </Button>
            </AlertAction>
          )}
        </Alert>
      )}

      {statusKind === "validation" && (
        <Alert variant="destructive" className="mb-3 rounded-xl">
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}

      {statusKind === "failed" && view === "discover" && (
        <Alert variant="destructive" className="mb-3 rounded-xl">
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {loading ? (
          <Spinner
            className="text-primary motion-reduce:animate-none"
            aria-hidden="true"
          />
        ) : (
          <Sparkles className="size-4 text-primary" aria-hidden="true" />
        )}
        <span className="min-w-0 break-words" data-testid="search-notice">
          {stripNotice}
        </span>
        {checked > 0 && view === "discover" && (
          <span className="ml-auto shrink-0 tabular-nums">
            {checked.toLocaleString()} checked
          </span>
        )}
        {view === "discover" && onRefresh && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto h-8 rounded-lg text-primary"
                  onClick={onRefresh}
                  aria-label="Refresh default search"
                >
                  <RefreshCw className="size-3.5" />
                </Button>
              }
            />
            <TooltipContent>Refresh default search</TooltipContent>
          </Tooltip>
        )}
      </div>

      {view === "discover" && providerStatuses.length > 0 && (
        <ul
          className="mt-3 flex flex-col gap-2"
          aria-label="Provider search status"
        >
          {providerStatuses.map((entry) => (
            <li
              key={entry.provider}
              className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground"
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
          className="mt-3"
          aria-label="Search progress"
        />
      )}
    </div>
  );
}
