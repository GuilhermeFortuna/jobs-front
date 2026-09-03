"use client";

import { Bookmark, BookmarkCheck, Globe2 } from "lucide-react";

import { CompanyLogo } from "@/components/job-scout/company-logo";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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

/**
 * Geometry shared by the real card and its loading skeleton. Both render it on
 * the same `Card` primitive so the skeleton cannot drift out of alignment and
 * reintroduce the reflow this replaced.
 */
export const JOB_CARD_SHELL_CLASS =
  "rounded-[14px] border bg-card py-4 shadow-card";

type JobCardProps = {
  job: DisplayJob;
  selected: boolean;
  onSelect: () => void;
  onSave: () => void;
};

export function JobCard({ job, selected, onSelect, onSave }: JobCardProps) {
  const saved = isSavedJob(job) && job.state === "saved";
  const applied = isSavedJob(job) && job.state === "applied";
  const saveLabel = `Save ${job.title} at ${job.company}`;

  return (
    <Card
      role="article"
      size="sm"
      className={cn(
        JOB_CARD_SHELL_CLASS,
        "group relative cursor-pointer ring-0 transition hover:-translate-y-0.5 hover:border-primary-border hover:shadow-card-hover motion-reduce:transform-none focus-ring",
        selected && "border-ring bg-selected ring-1 ring-ring",
      )}
      onClick={onSelect}
      tabIndex={0}
      data-testid="job-card"
      data-selected={selected ? "true" : "false"}
      data-job-key={jobKey(job)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
    >
      <CardHeader className="flex flex-row items-start gap-3.5 space-y-0">
        <CompanyLogo
          company={job.company}
          logoUrl={job.company_logo_url}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <CardDescription className="text-sm text-muted-foreground">
            {job.company}
          </CardDescription>
          <CardTitle className="mt-0.5 truncate pr-7 text-[17px] font-semibold tracking-[-0.015em]">
            <h3 className="truncate text-[17px] font-semibold tracking-[-0.015em]">
              {job.title}
            </h3>
          </CardTitle>
        </div>
        <CardAction>
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  aria-label={saveLabel}
                  className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-primary focus-ring"
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
              }
            />
            <TooltipContent>{saveLabel}</TooltipContent>
          </Tooltip>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
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
      </CardContent>
    </Card>
  );
}
