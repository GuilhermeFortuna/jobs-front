import type { JobResult } from "@/lib/api";

type ProviderJob = Pick<
  JobResult,
  "provider" | "provider_job_id" | "job_url" | "apply_url" | "alternate_sources"
>;

export const REMOTEOK_ATTRIBUTION = {
  url: "https://remoteok.com",
  text: "This job listing is provided by Remote OK. Please link back to https://remoteok.com when displaying this listing.",
} as const;

export const KNOWN_PROVIDER_KEYS = ["himalayas", "remoteok", "jobicy"] as const;

const PROVIDER_DISPLAY_NAMES: Record<string, string> = {
  himalayas: "Himalayas",
  remoteok: "Remote OK",
  jobicy: "Jobicy",
};

export function formatProviderName(key: string): string {
  return PROVIDER_DISPLAY_NAMES[key] ?? key;
}

export function providerJobUrl(
  job: ProviderJob,
  providerKey: string,
): string | null {
  if (job.provider === providerKey) {
    return job.job_url;
  }
  const alternate = job.alternate_sources?.find(
    (source) => source.provider === providerKey,
  );
  return alternate?.job_url ?? null;
}

export function providerApplyUrl(
  job: ProviderJob,
  providerKey: string,
): string | null {
  if (job.provider === providerKey) {
    return job.apply_url ?? null;
  }
  const alternate = job.alternate_sources?.find(
    (source) => source.provider === providerKey,
  );
  return alternate?.apply_url ?? null;
}

export function hasRemoteOkSource(job: ProviderJob): boolean {
  if (job.provider === "remoteok") return true;
  return (
    job.alternate_sources?.some((source) => source.provider === "remoteok") ??
    false
  );
}

export function failedProviderNames(
  providers: Array<{ provider: string; status: string }>,
): string[] {
  return providers
    .filter((entry) => entry.status === "failed")
    .map((entry) => formatProviderName(entry.provider));
}
