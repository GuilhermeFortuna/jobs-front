import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { JobDetail } from "@/components/job-scout/job-detail";
import type { JobResult } from "@/lib/api";

const job: JobResult = {
  provider: "himalayas",
  provider_job_id: "job-1",
  title: "Staff Engineer",
  company: "Linear",
  description: "Build product infrastructure.",
  employment_type: "full_time",
  remote_type: "remote",
  job_url: "https://himalayas.app/jobs/1",
  apply_url: "https://himalayas.app/jobs/1/apply",
  alternate_sources: [
    {
      provider: "remoteok",
      provider_job_id: "rok-1",
      job_url: "https://remoteok.com/remote-jobs/1",
      apply_url: "https://remoteok.com/remote-jobs/1",
    },
  ],
};

describe("JobDetail", () => {
  it("renders canonical and alternate source links", () => {
    render(<JobDetail job={job} onSave={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByText("Primary source")).toBeInTheDocument();
    expect(screen.getByLabelText("View Himalayas listing")).toBeInTheDocument();
    expect(screen.getByLabelText("View Remote OK listing")).toBeInTheDocument();
    expect(screen.getByLabelText("Apply via Remote OK")).toBeInTheDocument();
  });

  it("shows Remote OK attribution when that source is present", () => {
    render(<JobDetail job={job} onSave={vi.fn()} onRemove={vi.fn()} />);
    expect(
      screen.getAllByText(/provided by Remote OK/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByRole("link", { name: "https://remoteok.com" })[0],
    ).toHaveAttribute("href", "https://remoteok.com");
  });

  it("lists matched skills and never shows a raw relevance score", () => {
    const { container, rerender } = render(
      <JobDetail
        job={{
          ...job,
          matched_skills: ["Rust", "Go"],
          relevance_score: 19.2,
        }}
        onSave={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Matched skills").textContent).toBe("RustGo");
    expect(container.textContent).not.toMatch(/19\.2/);

    rerender(
      <JobDetail
        job={{ ...job, matched_skills: [] }}
        onSave={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.queryByLabelText("Matched skills")).not.toBeInTheDocument();
  });
});
