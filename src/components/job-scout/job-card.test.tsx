import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { JobCard } from "@/components/job-scout/job-card";
import type { JobResult } from "@/lib/api";

const job: JobResult = {
  provider: "himalayas",
  provider_job_id: "job-1",
  title: "Staff Engineer",
  company: "Linear",
  employment_type: "full_time",
  remote_type: "remote",
  job_url: "https://himalayas.app/jobs/1",
  alternate_sources: [
    {
      provider: "remoteok",
      provider_job_id: "rok-1",
      job_url: "https://remoteok.com/jobs/1",
      apply_url: null,
    },
  ],
};

describe("JobCard", () => {
  it("shows the canonical provider and additional source count", () => {
    render(
      <JobCard
        job={job}
        selected={false}
        onSelect={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    expect(screen.getByText(/Himalayas/)).toBeInTheDocument();
    expect(screen.getByText(/\+1 sources/)).toBeInTheDocument();
  });
});
