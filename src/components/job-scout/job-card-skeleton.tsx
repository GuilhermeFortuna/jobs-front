"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { JOB_CARD_SHELL_CLASS } from "@/components/job-scout/job-card";

/**
 * Sized to the real card by construction: same `Card` primitive, same shell
 * class, same header/content slots. Blocks land where the card's own rows land,
 * so the list does not reflow when results replace the skeletons.
 */
export function JobCardSkeleton() {
  return (
    <Card
      size="sm"
      aria-hidden="true"
      data-testid="job-card-skeleton"
      className={JOB_CARD_SHELL_CLASS}
    >
      <CardHeader className="flex flex-row items-start gap-3.5 space-y-0">
        <Skeleton className="size-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-5 w-3/4" />
        </div>
        <Skeleton className="size-9 shrink-0 rounded-lg" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
      </CardContent>
    </Card>
  );
}
