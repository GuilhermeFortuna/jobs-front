import { describe, expect, it } from "vitest";

import { preserveSelection } from "@/lib/job-utils";
import type { JobResult, SavedJob } from "@/lib/api";

const result = (id: string): JobResult => ({
  provider: "himalayas",
  provider_job_id: id,
  title: `Role ${id}`,
  company: "Acme",
  employment_type: "full_time",
  remote_type: "remote",
  job_url: "https://example.com",
});

const saved = (id: string, jobId: string): SavedJob => ({
  ...result(id),
  id: jobId,
  profile_id: "profile-1",
  state: "saved",
  saved_at: "2026-01-01T00:00:00Z",
  applied_at: null,
  updated_at: "2026-01-01T00:00:00Z",
});

describe("preserveSelection", () => {
  it("keeps the same search result during progressive updates", () => {
    const first = result("a");
    const second = result("b");
    const updatedFirst = { ...first, title: "Role A updated" };
    const next = [updatedFirst, second];
    expect(preserveSelection(next, first)).toEqual(updatedFirst);
  });

  it("keeps saved job selection by durable id", () => {
    const jobs = [saved("a", "uuid-1"), saved("b", "uuid-2")];
    const selected = jobs[1];
    expect(preserveSelection(jobs, selected)).toEqual(selected);
  });

  it("falls back to the first item when selection disappears", () => {
    const jobs = [result("a"), result("b")];
    const missing = result("gone");
    expect(preserveSelection(jobs, missing)).toEqual(jobs[0]);
  });
});
