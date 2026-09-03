"use client";

import {
  Bookmark,
  BookmarkCheck,
  BriefcaseBusiness,
  Globe2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  age,
  isSavedJob,
  jobKey,
  money,
  sourceCount,
  type DisplayJob,
} from "@/lib/job-utils";
import { formatProviderName } from "@/lib/providers";
import { cn } from "@/lib/utils";

type JobCardProps = {
  job: DisplayJob;
  selected: boolean;
  onSelect: () => void;
  onSave: () => void;
};

export function JobCard({ job, selected, onSelect, onSave }: JobCardProps) {
  const saved = isSavedJob(job) && job.state === "saved";
  const applied = isSavedJob(job) && job.state === "applied";

  return (
    <article
      className={cn(
        "group relative cursor-pointer rounded-[14px] border bg-card p-4 shadow-card transition hover:-translate-y-0.5 hover:border-primary-border hover:shadow-card-hover motion-reduce:transform-none focus-ring",
        selected && "border-ring bg-selected ring-1 ring-ring",
      )}
      onClick={onSelect}
      tabIndex={0}
      data-selected={selected ? "true" : "false"}
      data-job-key={jobKey(job)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <div className="flex gap-3.5">
        <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-foreground text-lg font-bold text-background">
          {job.company.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted-foreground">{job.company}</p>
          <h3 className="mt-0.5 truncate pr-7 text-[17px] font-semibold tracking-[-0.015em]">
            {job.title}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Globe2 className="size-3.5" aria-hidden="true" />
              {job.location_text ?? "Remote"}
            </span>
            <span className="font-medium text-foreground">{money(job)}</span>
          </div>
          <div className="mt-3 flex min-w-0 flex-wrap gap-1.5">
            <Badge variant="outline" className="max-w-full break-words">
              {formatProviderName(job.provider)}
              {sourceCount(job) > 1 && ` · +${sourceCount(job) - 1} sources`}
            </Badge>
            <Badge variant="secondary">
              {job.employment_type.replaceAll("_", " ")}
            </Badge>
            {job.seniority && (
              <Badge variant="outline" className="text-primary">
                {job.seniority}
              </Badge>
            )}
            {applied && (
              <Badge className="border-0 bg-applied-soft text-destructive">
                Applied
              </Badge>
            )}
            {saved && !applied && (
              <Badge className="border-0 bg-primary-soft text-primary">
                Saved
              </Badge>
            )}
            <span className="ml-auto text-xs text-muted-foreground">
              {age(job.posted_at)}
            </span>
          </div>
          {job.matched_skills && job.matched_skills.length > 0 && (
            <div
              className="mt-2 flex min-w-0 flex-wrap gap-1.5"
              aria-label="Matched skills"
            >
              {job.matched_skills.map((skill) => (
                <Badge
                  key={skill}
                  variant="outline"
                  className="border-primary-border bg-primary-soft text-primary"
                >
                  {skill}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          aria-label={`Save ${job.title} at ${job.company}`}
          className="absolute right-3 top-3 rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-primary focus-ring"
          onClick={(event) => {
            event.stopPropagation();
            onSave();
          }}
        >
          {saved || applied ? (
            <BookmarkCheck
              className={cn(
                "size-5",
                applied ? "text-applied" : "text-primary",
              )}
            />
          ) : (
            <Bookmark className="size-5" />
          )}
        </button>
      </div>
    </article>
  );
}

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
      <div className="mx-auto flex max-w-sm flex-col items-center px-6 py-20 text-center">
        <h2 className="text-lg font-semibold">API unavailable</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Start the backend or retry when the connection is restored.
        </p>
        {onRetry && (
          <button
            type="button"
            className="mt-5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            onClick={onRetry}
          >
            Retry connection
          </button>
        )}
      </div>
    );
  }

  if (view === "discover" && statusKind === "empty") {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center px-6 py-20 text-center">
        <h2 className="text-lg font-semibold">No matching roles</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Try broader keywords, fewer filters, or a lower salary floor.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-6 py-20 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
        {view === "applied" ? <BriefcaseBusiness /> : <Bookmark />}
      </div>
      <h2 className="mt-4 text-lg font-semibold">No {view} roles yet</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Your profile keeps its own private library. Discover a role and add it
        when it feels worth returning to.
      </p>
      <button
        type="button"
        className="mt-5 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        onClick={onDiscover}
      >
        Discover roles
      </button>
    </div>
  );
}
