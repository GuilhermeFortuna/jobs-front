"use client";

import { AlertTriangle, LoaderCircle, RefreshCw, Sparkles } from "lucide-react";

import { Progress } from "@/components/ui/progress";
import type { StatusKind } from "@/hooks/use-job-scout";
import { Button } from "@/components/ui/button";

type SearchStatusProps = {
  view: "discover" | "saved" | "applied";
  loading: boolean;
  notice: string;
  checked: number;
  progress: number;
  warnings: string[];
  statusKind: StatusKind;
  searchExpired: boolean;
  onRetry?: () => void;
  onRefresh?: () => void;
  onRunSearch?: () => void;
};

export function SearchStatus({
  view,
  loading,
  notice,
  checked,
  progress,
  warnings,
  statusKind,
  searchExpired,
  onRetry,
  onRefresh,
  onRunSearch,
}: SearchStatusProps) {
  return (
    <div className="border-b bg-white px-5 py-5">
      {warnings.length > 0 && view === "discover" && (
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

      <div
        className="flex items-center gap-2 text-sm text-[#56617d]"
        aria-live="polite"
      >
        {loading ? (
          <LoaderCircle
            className="size-4 animate-spin text-[#3d49df] motion-reduce:animate-none"
            aria-hidden="true"
          />
        ) : (
          <Sparkles className="size-4 text-[#3d49df]" aria-hidden="true" />
        )}
        <span className="truncate">{notice}</span>
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
