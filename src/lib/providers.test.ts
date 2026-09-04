import { describe, expect, it } from "vitest";

import {
  formatProviderName,
  hasRemoteOkSource,
  failedProviderNames,
} from "@/lib/providers";
import type { JobResult } from "@/lib/api";

const job = (overrides: Partial<JobResult> = {}): JobResult => ({
  provider: "himalayas",
  provider_job_id: "h-1",
  title: "Engineer",
  company: "Acme",
  employment_type: "full_time",
  remote_type: "remote",
  job_url: "https://himalayas.app/jobs/1",
  ...overrides,
});

describe("providers", () => {
  it("formats known provider keys", () => {
    expect(formatProviderName("himalayas")).toBe("Himalayas");
    expect(formatProviderName("remoteok")).toBe("Remote OK");
    expect(formatProviderName("jobicy")).toBe("Jobicy");
    expect(formatProviderName("adzuna")).toBe("Adzuna");
    expect(formatProviderName("remotive")).toBe("Remotive");
    expect(formatProviderName("weworkremotely")).toBe("We Work Remotely");
  });

  it("detects Remote OK in canonical and alternate sources", () => {
    expect(hasRemoteOkSource(job())).toBe(false);
    expect(hasRemoteOkSource(job({ provider: "remoteok" }))).toBe(true);
    expect(
      hasRemoteOkSource(
        job({
          alternate_sources: [
            {
              provider: "remoteok",
              provider_job_id: "r-1",
              job_url: "https://remoteok.com/jobs/1",
              apply_url: null,
            },
          ],
        }),
      ),
    ).toBe(true);
  });

  it("lists failed provider display names", () => {
    expect(
      failedProviderNames([
        { provider: "himalayas", status: "complete" },
        { provider: "jobicy", status: "failed" },
      ]),
    ).toEqual(["Jobicy"]);
  });
});
