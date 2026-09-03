"use client";

import {
  Bookmark,
  BriefcaseBusiness,
  CheckCircle2,
  ExternalLink,
  Globe2,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
    <div className="rounded-xl border bg-[#fafbfc] p-4">
      <p className="text-sm font-semibold text-[#111936]">
        {isPrimary ? "Primary source" : label}
        {isPrimary && (
          <span className="ml-2 font-normal text-[#6d7690]">({label})</span>
        )}
      </p>
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        <a
          href={jobUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={`View ${label} listing`}
          className="inline-flex items-center gap-1.5 font-semibold text-[#3d49df]"
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
            className="inline-flex items-center gap-1.5 font-semibold text-[#3d49df]"
          >
            Apply
            <ExternalLink className="size-4" aria-hidden="true" />
          </a>
        )}
      </div>
    </div>
  );
}

export function JobDetail({ job, onSave, onRemove }: JobDetailProps) {
  const saved = isSavedJob(job);
  const isApplied = saved && job.state === "applied";
  const isSaved = saved && job.state === "saved";
  const alternates = job.alternate_sources ?? [];

  return (
    <div className="mx-auto flex min-h-full max-w-[760px] flex-col px-5 pb-24 pt-7 sm:px-8 sm:pb-8 lg:px-10">
      <div className="flex items-start gap-4">
        <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#111936] text-xl font-bold text-white">
          {job.company.slice(0, 1)}
        </div>
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
              className="text-[#3d49df]"
            >
              <ExternalLink className="size-4" />
            </a>
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#5f6982]">
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
        <Badge className="border-0 bg-[#e9f7ec] px-3 py-1 text-[#236c39]">
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
          <h3 className="text-sm font-semibold text-[#111936]">
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
                className="border-[#c9cef5] bg-[#f4f5ff] px-3 py-1 text-[#3d49df]"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}
      <div className="mt-6 grid grid-cols-2 gap-3 border-y py-5">
        <Button
          variant="outline"
          className="h-11 rounded-xl"
          onClick={() => onSave("saved")}
        >
          <Bookmark />
          {isSaved ? "Saved" : isApplied ? "Move to saved" : "Save"}
        </Button>
        <Button
          className="h-11 rounded-xl bg-[#f26450] text-white hover:bg-[#df503d]"
          onClick={() => onSave("applied")}
        >
          <CheckCircle2 />
          {isApplied ? "Applied" : "Mark as applied"}
        </Button>
      </div>
      <article className="mt-7 flex-1">
        <div className="mb-6 flex gap-7 border-b text-sm font-semibold text-[#68728a]">
          <span className="border-b-2 border-[#3d49df] pb-3 text-[#3d49df]">
            Overview
          </span>
        </div>
        <div className="whitespace-pre-line text-[15px] leading-7 text-[#3d4660]">
          {job.description ||
            "Open the source listing to read the full role description."}
        </div>
        <h3 className="mt-7 font-semibold text-[#111936]">Role details</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline">{job.remote_type}</Badge>
          <Badge variant="outline">
            {job.employment_type.replaceAll("_", " ")}
          </Badge>
          {job.seniority && <Badge variant="outline">{job.seniority}</Badge>}
        </div>
        <h3 className="mt-7 font-semibold text-[#111936]">Sources</h3>
        <div className="mt-3 space-y-3">
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
      </article>
      {hasRemoteOkSource(job) && (
        <p className="mt-8 text-sm leading-6 text-[#768098]">
          {REMOTEOK_ATTRIBUTION.text}{" "}
          <a
            href={REMOTEOK_ATTRIBUTION.url}
            className="font-semibold text-[#3d49df]"
            target="_blank"
            rel="noreferrer"
          >
            {REMOTEOK_ATTRIBUTION.url}
          </a>
        </p>
      )}
      <footer className="mt-6 flex items-center border-t pt-5 text-sm text-[#768098]">
        {saved && (
          <Button
            variant="ghost"
            className="ml-auto text-[#b34438]"
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
