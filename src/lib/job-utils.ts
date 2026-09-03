import type { JobResult, SavedJob } from "@/lib/api";

export type DisplayJob = JobResult | SavedJob;

export function isSavedJob(job: DisplayJob): job is SavedJob {
  return "id" in job && typeof job.id === "string";
}

export function jobKey(job: DisplayJob): string {
  return `${job.provider}:${job.provider_job_id}`;
}

export function jobIdentities(job: DisplayJob): string[] {
  const keys = [jobKey(job)];
  for (const source of job.alternate_sources ?? []) {
    keys.push(`${source.provider}:${source.provider_job_id}`);
  }
  return keys;
}

export function sourceCount(job: DisplayJob): number {
  return 1 + (job.alternate_sources?.length ?? 0);
}

export function identitiesOverlap(a: DisplayJob, b: DisplayJob): boolean {
  const keys = new Set(jobIdentities(a));
  return jobIdentities(b).some((identity) => keys.has(identity));
}

export function findJobIndex(jobs: DisplayJob[], target: DisplayJob): number {
  if (isSavedJob(target)) {
    const byId = jobs.findIndex(
      (job) => isSavedJob(job) && job.id === target.id,
    );
    if (byId >= 0) return byId;
  }
  return jobs.findIndex((job) => identitiesOverlap(job, target));
}

export function preserveSelection(
  jobs: DisplayJob[],
  previous: DisplayJob | null,
): DisplayJob | null {
  if (!previous) return jobs[0] ?? null;

  if (isSavedJob(previous)) {
    const index = findJobIndex(jobs, previous);
    return index >= 0 ? (jobs[index] ?? null) : (jobs[0] ?? null);
  }

  const previousKeys = new Set(jobIdentities(previous));
  for (const job of jobs) {
    if (isSavedJob(job)) continue;
    for (const identity of jobIdentities(job)) {
      if (previousKeys.has(identity)) return job;
    }
  }

  const index = findJobIndex(jobs, previous);
  if (index >= 0) return jobs[index] ?? null;
  return jobs[0] ?? null;
}

export function money(job: DisplayJob) {
  const compact = (value: number) => `$${Math.round(value / 1000)}k`;
  if (job.salary_min_annual && job.salary_max_annual)
    return `${compact(job.salary_min_annual)}–${compact(job.salary_max_annual)}`;
  if (job.salary_min_annual) return `From ${compact(job.salary_min_annual)}`;
  return "Salary not listed";
}

export function age(value?: string | null) {
  if (!value) return "Recently posted";
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000),
  );
  return days === 0 ? "Today" : `${days}d ago`;
}

export function countActiveFilters(filters: {
  employment_types: string[];
  seniority: string[];
  providers: string[];
  minimum_salary?: number | null;
  posted_within_days?: number | null;
  country?: string | null;
  worldwide?: boolean | null;
}): number {
  return (
    filters.employment_types.length +
    filters.seniority.length +
    filters.providers.length +
    Number(Boolean(filters.minimum_salary)) +
    Number(Boolean(filters.posted_within_days)) +
    Number(Boolean(filters.country || filters.worldwide))
  );
}
