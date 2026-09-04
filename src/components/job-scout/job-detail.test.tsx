import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { JobDetail } from "@/components/job-scout/job-detail";
import type { JobResult, SavedJob } from "@/lib/api";

afterEach(cleanup);

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

function openSourcesTab() {
  fireEvent.click(screen.getByRole("tab", { name: "Sources" }));
}

describe("JobDetail", () => {
  it("divides description and sources across real tabs", () => {
    render(<JobDetail job={job} onSave={vi.fn()} onRemove={vi.fn()} />);

    expect(screen.getByRole("tab", { name: "Overview" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Sources" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(
      screen.getByText("Build product infrastructure."),
    ).toBeInTheDocument();
    expect(screen.getByText("Role details")).toBeInTheDocument();
    expect(screen.queryByText("Primary source")).not.toBeInTheDocument();

    openSourcesTab();

    expect(screen.getByRole("tab", { name: "Sources" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByText("Primary source")).toBeInTheDocument();
    expect(
      screen.queryByText("Build product infrastructure."),
    ).not.toBeInTheDocument();
  });

  it("formats flattened job descriptions into readable sections and lists", () => {
    render(
      <JobDetail
        job={{
          ...job,
          description:
            "We build dependable financial tooling. Our tools & stack- Python, AWS, and PostgreSQL What you'll do - Build API services - Improve the platform - Support product teams What you'll bring- 5+ years of Python experience - Strong SQL skills",
        }}
        onSave={vi.fn()}
        onRemove={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Our tools & stack" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "What you'll do" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "What you'll bring" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Build API services")).toHaveProperty(
      "tagName",
      "LI",
    );
    expect(screen.getByText("Strong SQL skills")).toHaveProperty(
      "tagName",
      "LI",
    );
  });

  it("renders canonical and alternate source links", () => {
    render(<JobDetail job={job} onSave={vi.fn()} onRemove={vi.fn()} />);
    openSourcesTab();
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
    const chips = screen.getByLabelText("Matched skills");
    expect(Array.from(chips.children).map((el) => el.textContent)).toEqual([
      "Rust",
      "Go",
    ]);
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

  it("uses the shared company logo with letter-tile fallback", () => {
    const { rerender } = render(
      <JobDetail job={job} onSave={vi.fn()} onRemove={vi.fn()} />,
    );
    expect(screen.getByTestId("company-logo-fallback")).toHaveTextContent("L");

    rerender(
      <JobDetail
        job={{
          ...job,
          company_logo_url: "https://cdn.example.com/linear.png",
        }}
        onSave={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(screen.getByTestId("company-logo")).toBeInTheDocument();
  });

  it("keeps the three-way Save label logic", () => {
    const { rerender } = render(
      <JobDetail job={job} onSave={vi.fn()} onRemove={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: /^Save$/ })).toBeInTheDocument();

    const saved: SavedJob = {
      ...job,
      id: "saved-1",
      profile_id: "profile-1",
      state: "saved",
      saved_at: "2026-01-01T00:00:00Z",
      applied_at: null,
      updated_at: "2026-01-01T00:00:00Z",
    };
    rerender(<JobDetail job={saved} onSave={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByRole("button", { name: /^Saved$/ })).toBeInTheDocument();

    rerender(
      <JobDetail
        job={{ ...saved, state: "applied", applied_at: "2026-01-02T00:00:00Z" }}
        onSave={vi.fn()}
        onRemove={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: /^Move to saved$/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /^Applied$/ }),
    ).toBeInTheDocument();
  });

  it("keeps saved snapshots viewable without a live listing", () => {
    const snapshot: SavedJob = {
      ...job,
      id: "saved-1",
      profile_id: "profile-1",
      state: "saved",
      saved_at: "2026-01-01T00:00:00Z",
      applied_at: null,
      updated_at: "2026-01-01T00:00:00Z",
    };
    render(<JobDetail job={snapshot} onSave={vi.fn()} onRemove={vi.fn()} />);
    expect(screen.getByTestId("job-detail")).toBeInTheDocument();
    expect(screen.getByText("Staff Engineer")).toBeInTheDocument();
    expect(
      within(screen.getByTestId("job-detail")).getByRole("button", {
        name: /Remove permanently/,
      }),
    ).toBeInTheDocument();
  });
});
