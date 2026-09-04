"use client";

import { useEffect, useState } from "react";
import { Bookmark, BriefcaseBusiness, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { BlurFade } from "@/components/ui/blur-fade";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

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

function EmptyMotion({ children }: { children: React.ReactNode }) {
  const reducedMotion = usePrefersReducedMotion();
  const narrow = useNarrowViewport();
  const supportsObserver =
    typeof window !== "undefined" && "IntersectionObserver" in window;
  const animate = supportsObserver && !reducedMotion && !narrow;

  if (!animate) {
    return <div data-testid="empty-state-static">{children}</div>;
  }

  return (
    <BlurFade data-testid="empty-state-motion" duration={0.35} offset={8}>
      {children}
    </BlurFade>
  );
}

export function EmptyState({
  view,
  statusKind,
  onDiscover,
  onRetry,
  onSearch,
  searchEnabled = true,
}: {
  view: "discover" | "saved" | "applied";
  statusKind?: string;
  onDiscover: () => void;
  onRetry?: () => void;
  onSearch?: () => void;
  searchEnabled?: boolean;
}) {
  if (view === "discover" && statusKind === "offline") {
    return (
      <EmptyMotion>
        <Empty className="mx-auto max-w-sm border-0 px-6 py-20">
          <EmptyHeader>
            <EmptyTitle className="text-lg font-semibold">
              API unavailable
            </EmptyTitle>
            <EmptyDescription className="mt-2 text-sm leading-6">
              Start the backend or retry when the connection is restored.
            </EmptyDescription>
          </EmptyHeader>
          {onRetry && (
            <EmptyContent>
              <Button
                type="button"
                className="mt-5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                onClick={onRetry}
              >
                Retry connection
              </Button>
            </EmptyContent>
          )}
        </Empty>
      </EmptyMotion>
    );
  }

  if (view === "discover" && statusKind === "empty") {
    return (
      <EmptyMotion>
        <Empty className="mx-auto max-w-sm border-0 px-6 py-20">
          <EmptyHeader>
            <EmptyTitle className="text-lg font-semibold">
              No matching roles
            </EmptyTitle>
            <EmptyDescription className="mt-2 text-sm leading-6">
              Try broader keywords, fewer filters, or a lower salary floor.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </EmptyMotion>
    );
  }

  if (view === "discover" && statusKind === "idle") {
    return (
      <EmptyMotion>
        <Empty className="mx-auto max-w-sm border-0 px-6 py-20">
          <EmptyHeader>
            <EmptyMedia
              variant="icon"
              className="size-12 rounded-2xl bg-primary-soft text-primary-emphasis dark:text-primary"
            >
              <Search />
            </EmptyMedia>
            <EmptyTitle className="mt-4 text-lg font-semibold">
              No search has run
            </EmptyTitle>
            <EmptyDescription className="mt-2 text-sm leading-6">
              Add a job criterion, then start an explicit search when you are
              ready.
            </EmptyDescription>
          </EmptyHeader>
          {onSearch ? (
            <EmptyContent>
              <Button
                type="button"
                className="mt-5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
                onClick={onSearch}
                disabled={!searchEnabled}
                aria-describedby={
                  !searchEnabled ? "idle-search-criteria-help" : undefined
                }
              >
                Search roles
              </Button>
              {!searchEnabled ? (
                <p id="idle-search-criteria-help" className="sr-only">
                  Add a job criterion before searching.
                </p>
              ) : null}
            </EmptyContent>
          ) : null}
        </Empty>
      </EmptyMotion>
    );
  }

  return (
    <EmptyMotion>
      <Empty className="mx-auto max-w-sm border-0 px-6 py-20">
        <EmptyHeader>
          <EmptyMedia
            variant="icon"
            className="size-12 rounded-2xl bg-primary-soft text-primary-emphasis dark:text-primary"
          >
            {view === "applied" ? <BriefcaseBusiness /> : <Bookmark />}
          </EmptyMedia>
          <EmptyTitle className="mt-4 text-lg font-semibold">
            No {view} roles yet
          </EmptyTitle>
          <EmptyDescription className="mt-2 text-sm leading-6">
            Your profile keeps its own private library. Discover a role and add
            it when it feels worth returning to.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button
            type="button"
            className="mt-5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            onClick={onDiscover}
          >
            Discover roles
          </Button>
        </EmptyContent>
      </Empty>
    </EmptyMotion>
  );
}

export function DetailEmptyState() {
  return (
    <Empty className="grid h-full place-items-center border-0">
      <EmptyDescription>Select a role to view details</EmptyDescription>
    </Empty>
  );
}
