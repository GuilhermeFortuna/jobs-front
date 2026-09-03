"use client";

import { Bookmark, BriefcaseBusiness } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function EmptyState({
  view,
  statusKind,
  onDiscover,
  onRetry,
}: {
  view: "discover" | "saved" | "applied";
  statusKind?: string;
  onDiscover: () => void;
  onRetry?: () => void;
}) {
  if (view === "discover" && statusKind === "offline") {
    return (
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
    );
  }

  if (view === "discover" && statusKind === "empty") {
    return (
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
    );
  }

  return (
    <Empty className="mx-auto max-w-sm border-0 px-6 py-20">
      <EmptyHeader>
        <EmptyMedia
          variant="icon"
          className="size-12 rounded-2xl bg-primary-soft text-primary"
        >
          {view === "applied" ? <BriefcaseBusiness /> : <Bookmark />}
        </EmptyMedia>
        <EmptyTitle className="mt-4 text-lg font-semibold">
          No {view} roles yet
        </EmptyTitle>
        <EmptyDescription className="mt-2 text-sm leading-6">
          Your profile keeps its own private library. Discover a role and add it
          when it feels worth returning to.
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
  );
}

export function DetailEmptyState() {
  return (
    <Empty className="grid h-full place-items-center border-0">
      <EmptyDescription>Select a role to view details</EmptyDescription>
    </Empty>
  );
}
