"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  XCircle,
} from "lucide-react";

import AILoadingState, {
  type AILoadingSequence,
} from "@/components/kokonutui/ai-loading";
import { isTransientNotice } from "@/components/job-scout/transient-notice";
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
  refreshEnabled?: boolean;
  onRunSearch?: () => void;
};

type BannerVariant = "warning" | "destructive" | "info";

type StatusBannerConfig = {
  key: string;
  variant: BannerVariant;
  role?: "status" | "alert";
  description: ReactNode;
  action?: ReactNode;
};

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return reduced;
}

function useNarrowViewport(): boolean {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const sync = () => setNarrow(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return narrow;
}

function ProviderStatusIcon({
  status,
}: {
  status: ProviderSearchStatus["status"];
}) {
  if (status === "loading") {
    return (
      <Spinner
        className="size-3.5 text-primary-emphasis motion-reduce:animate-none dark:text-primary"
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

function StatusBanner({ config }: { config: StatusBannerConfig }) {
  return (
    <Alert
      variant={config.variant}
      {...(config.role ? { role: config.role } : {})}
      className="mb-3 rounded-xl"
      data-testid={`status-banner-${config.key}`}
    >
      {config.variant === "warning" && <AlertTriangle aria-hidden="true" />}
      <AlertDescription>{config.description}</AlertDescription>
      {config.action ? <AlertAction>{config.action}</AlertAction> : null}
    </Alert>
  );
}

function resolveBanner(props: {
  view: SearchStatusProps["view"];
  statusKind: StatusKind;
  searchExpired: boolean;
  warnings: string[];
  notice: string;
  total: number | null;
  failedProviders: ProviderSearchStatus[];
  onRetry?: () => void;
  onRunSearch?: () => void;
}): StatusBannerConfig | null {
  const {
    view,
    statusKind,
    searchExpired,
    warnings,
    notice,
    total,
    failedProviders,
    onRetry,
    onRunSearch,
  } = props;

  if (statusKind === "partial" && view === "discover") {
    return {
      key: "partial",
      variant: "warning",
      role: "status",
      description: (
        <>
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
        </>
      ),
    };
  }

  if (
    warnings.length > 0 &&
    view === "discover" &&
    statusKind !== "partial" &&
    statusKind !== "failed"
  ) {
    return {
      key: "warning",
      variant: "warning",
      role: "status",
      description: warnings[0],
    };
  }

  if (searchExpired && view === "discover") {
    return {
      key: "expired",
      variant: "destructive",
      description: "Search expired · start a new search to save roles",
      action: onRunSearch ? (
        <Button
          size="sm"
          variant="outline"
          className="h-8 rounded-lg"
          onClick={onRunSearch}
        >
          Run search
        </Button>
      ) : undefined,
    };
  }

  if (statusKind === "offline") {
    return {
      key: "offline",
      variant: "info",
      description: notice,
      action: onRetry ? (
        <Button
          size="sm"
          variant="outline"
          className="h-8 rounded-lg"
          onClick={onRetry}
        >
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      ) : undefined,
    };
  }

  if (statusKind === "validation") {
    return {
      key: "validation",
      variant: "destructive",
      description: notice,
    };
  }

  if (statusKind === "failed" && view === "discover") {
    return {
      key: "failed",
      variant: "destructive",
      description: notice,
    };
  }

  return null;
}

function buildLoadingSequences(
  notice: string,
  providerStatuses: ProviderSearchStatus[],
): AILoadingSequence[] {
  const lines =
    providerStatuses.length > 0
      ? providerStatuses.map((entry) => {
          const name = formatProviderName(entry.provider);
          if (entry.status === "failed") return `${name}: unavailable`;
          if (entry.status === "complete") {
            return entry.checked_count > 0
              ? `${name}: ${entry.checked_count.toLocaleString()} checked`
              : `${name}: complete`;
          }
          return entry.checked_count > 0
            ? `${name}: ${entry.checked_count.toLocaleString()} checked · ${Math.round(entry.progress * 100)}%`
            : `${name}: searching…`;
        })
      : [notice || "Contacting providers…"];

  return [
    {
      status: notice || "Searching providers",
      lines,
    },
  ];
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
  refreshEnabled = true,
  onRunSearch,
}: SearchStatusProps) {
  const reducedMotion = usePrefersReducedMotion();
  const narrow = useNarrowViewport();
  const expressive =
    loading && view === "discover" && !reducedMotion && !narrow;

  const failedProviders = providerStatuses.filter(
    (entry) => entry.status === "failed",
  );
  const stripNotice = isTransientNotice(notice) ? "" : notice;

  const banner = resolveBanner({
    view,
    statusKind,
    searchExpired,
    warnings,
    notice,
    total,
    failedProviders,
    onRetry,
    onRunSearch,
  });

  const sequences = useMemo(
    () => buildLoadingSequences(stripNotice || notice, providerStatuses),
    [stripNotice, notice, providerStatuses],
  );

  return (
    <div className="border-b bg-surface px-5 py-5" data-testid="search-status">
      <div className="sr-only" aria-live="polite">
        {liveAnnouncement}
      </div>

      {banner ? <StatusBanner config={banner} /> : null}

      {expressive ? (
        <div className="mb-3" data-testid="search-in-progress-expressive">
          <AILoadingState sequences={sequences} progress={progress} />
        </div>
      ) : null}

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {loading ? (
          <Spinner
            className="text-primary-emphasis motion-reduce:animate-none dark:text-primary"
            aria-hidden="true"
          />
        ) : (
          <Sparkles
            className="size-4 text-primary-emphasis dark:text-primary"
            aria-hidden="true"
          />
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
                  className="ml-auto h-8 rounded-lg text-primary-emphasis dark:text-primary"
                  onClick={onRefresh}
                  disabled={!refreshEnabled}
                  aria-describedby={
                    !refreshEnabled ? "refresh-criteria-help" : undefined
                  }
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
      {!refreshEnabled && view === "discover" && onRefresh ? (
        <p id="refresh-criteria-help" className="sr-only">
          Save actionable defaults before refreshing the provider search.
        </p>
      ) : null}

      {view === "discover" && providerStatuses.length > 0 && (
        <ul
          className="mt-3 flex flex-col gap-2"
          aria-label="Provider search status"
          data-testid="provider-status-list"
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
