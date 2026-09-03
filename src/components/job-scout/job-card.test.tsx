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
  relevance_score: 42.5,
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

  it("renders matched skills in API order and hides an empty list", () => {
    const { rerender } = render(
      <JobCard
        job={{ ...job, matched_skills: ["Python", "PostgreSQL"] }}
        selected={false}
        onSelect={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    const chips = screen.getByLabelText("Matched skills");
    expect(Array.from(chips.children).map((el) => el.textContent)).toEqual([
      "Python",
      "PostgreSQL",
    ]);

    rerender(
      <JobCard
        job={{ ...job, matched_skills: [] }}
        selected={false}
        onSelect={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText("Matched skills")).not.toBeInTheDocument();
  });

  it("never displays the raw relevance score", () => {
    const { container } = render(
      <JobCard
        job={job}
        selected={false}
        onSelect={vi.fn()}
        onSave={vi.fn()}
      />,
    );
    expect(container.textContent).not.toMatch(/42\.5/);
    expect(container.textContent).not.toMatch(/relevance_score/i);
  });
});
