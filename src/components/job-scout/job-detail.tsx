"use client";

import {
  Bookmark,
  BriefcaseBusiness,
  CheckCircle2,
  ExternalLink,
  Globe2,
  Trash2,
} from "lucide-react";

import { CompanyLogo } from "@/components/job-scout/company-logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isSavedJob, money, type DisplayJob } from "@/lib/job-utils";
import {
  formatProviderName,
  hasRemoteOkSource,
  REMOTEOK_ATTRIBUTION,
} from "@/lib/providers";

type JobDetailProps = {
  job: DisplayJob;
  onSave: (state: "saved" | "applied") => void;
  onRemove: () => void;
};

function SourceLinks({
  provider,
  jobUrl,
  applyUrl,
  isPrimary,
}: {
  provider: string;
  jobUrl: string;
  applyUrl?: string | null;
  isPrimary?: boolean;
}) {
  const label = formatProviderName(provider);
  return (
    <Card size="sm" className="rounded-xl border bg-surface ring-0">
      <CardHeader>
        <CardTitle className="text-sm font-semibold text-foreground">
          {isPrimary ? "Primary source" : label}
          {isPrimary && (
            <span className="ml-2 font-normal text-muted-foreground">
              ({label})
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3 text-sm">
          <a
            href={jobUrl}
            target="_blank"
            rel="noreferrer"
            aria-label={`View ${label} listing`}
            className="inline-flex items-center gap-1.5 font-semibold text-primary-emphasis dark:text-primary"
          >
            View listing
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
          {applyUrl && (
            <a
              href={applyUrl}
              target="_blank"
              rel="noreferrer"
              aria-label={`Apply via ${label}`}
              className="inline-flex items-center gap-1.5 font-semibold text-primary-emphasis dark:text-primary"
            >
              Apply
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function JobDetail({ job, onSave, onRemove }: JobDetailProps) {
  const saved = isSavedJob(job);
  const isApplied = saved && job.state === "applied";
  const isSaved = saved && job.state === "saved";
  const alternates = job.alternate_sources ?? [];

  return (
    <div
      className="mx-auto flex min-h-full max-w-[760px] flex-col px-5 pb-24 pt-7 sm:px-8 sm:pb-8 lg:px-10"
      data-testid="job-detail"
    >
      <div className="flex items-start gap-4">
        <CompanyLogo
          company={job.company}
          logoUrl={job.company_logo_url}
          size="md"
        />
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-[-0.025em] sm:text-[30px]">
            {job.title}
          </h2>
          <p className="mt-1 flex items-center gap-2 font-semibold">
            {job.company}
            <a
              href={job.job_url}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${job.title} listing on ${formatProviderName(job.provider)}`}
              className="text-primary-emphasis dark:text-primary"
            >
              <ExternalLink className="size-4" />
            </a>
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Globe2 className="size-4" aria-hidden="true" />
          {job.location_text ?? "Remote"}
        </span>
        <span className="flex items-center gap-1.5">
          <BriefcaseBusiness className="size-4" aria-hidden="true" />
          {job.employment_type.replaceAll("_", " ")}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className="border-data-border px-3 py-1 text-data-foreground"
        >
          {money(job)} {job.salary_currency ?? ""}
        </Badge>
        <Badge variant="outline" className="break-words">
          {formatProviderName(job.provider)}
          {alternates.length > 0 && ` · +${alternates.length} sources`}
        </Badge>
        {job.seniority && (
          <Badge variant="secondary" className="px-3 py-1">
            {job.seniority}
          </Badge>
        )}
      </div>
      {job.matched_skills && job.matched_skills.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-semibold text-foreground">
            Matched skills
          </h3>
          <div
            className="mt-2 flex flex-wrap gap-2"
            aria-label="Matched skills"
          >
            {job.matched_skills.map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className="border-primary-border bg-primary-soft px-3 py-1 text-primary-emphasis dark:text-primary"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}
      <Separator className="mt-6" />
      <div className="grid grid-cols-2 gap-3 py-5">
        <Button
          variant="outline"
          className="h-11 rounded-xl"
          onClick={() => onSave("saved")}
        >
          <Bookmark />
          {isSaved ? "Saved" : isApplied ? "Move to saved" : "Save"}
        </Button>
        <Button
          variant="outline"
          className="h-11 rounded-xl border-applied-border bg-transparent text-applied-foreground hover:bg-applied-soft hover:text-applied-foreground dark:border-applied-border dark:bg-transparent dark:hover:bg-applied-soft"
          onClick={() => onSave("applied")}
        >
          <CheckCircle2 />
          {isApplied ? "Applied" : "Mark as applied"}
        </Button>
      </div>
      <Separator />
      <article className="mt-7 flex-1">
        <Tabs defaultValue="overview">
          <TabsList
            variant="line"
            className="mb-6 h-auto w-full justify-start gap-7 rounded-none bg-transparent p-0"
          >
            <TabsTrigger
              value="overview"
              className="rounded-none border-b-2 border-transparent px-0 pb-3 data-active:border-primary data-active:shadow-none"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="sources"
              className="rounded-none border-b-2 border-transparent px-0 pb-3 data-active:border-primary data-active:shadow-none"
            >
              Sources
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-0">
            <div className="whitespace-pre-line text-[15px] leading-7 text-foreground/80">
              {job.description ||
                "Open the source listing to read the full role description."}
            </div>
            <h3 className="mt-7 font-semibold text-foreground">Role details</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="outline">{job.remote_type}</Badge>
              <Badge variant="outline">
                {job.employment_type.replaceAll("_", " ")}
              </Badge>
              {job.seniority && (
                <Badge variant="outline">{job.seniority}</Badge>
              )}
            </div>
          </TabsContent>
          <TabsContent value="sources" className="mt-0">
            <div className="flex flex-col gap-3">
              <SourceLinks
                provider={job.provider}
                jobUrl={job.job_url}
                applyUrl={job.apply_url}
                isPrimary
              />
              {alternates.map((source) => (
                <SourceLinks
                  key={`${source.provider}:${source.provider_job_id}`}
                  provider={source.provider}
                  jobUrl={source.job_url}
                  applyUrl={source.apply_url}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </article>
      {hasRemoteOkSource(job) && (
        <p className="mt-8 text-sm leading-6 text-muted-foreground">
          {REMOTEOK_ATTRIBUTION.text}{" "}
          <a
            href={REMOTEOK_ATTRIBUTION.url}
            className="font-semibold text-primary-emphasis dark:text-primary"
            target="_blank"
            rel="noreferrer"
          >
            {REMOTEOK_ATTRIBUTION.url}
          </a>
        </p>
      )}
      <Separator className="mt-6" />
      <footer className="flex items-center pt-5 text-sm text-muted-foreground">
        {saved && (
          <Button
            variant="ghost"
            className="ml-auto text-destructive"
            onClick={onRemove}
          >
            <Trash2 />
            Remove permanently
          </Button>
        )}
      </footer>
    </div>
  );
}
