import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { JobCard, JOB_CARD_SHELL_CLASS } from "@/components/job-scout/job-card";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { JobResult } from "@/lib/api";

afterEach(cleanup);

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

function renderCard(
  props: Partial<{
    job: JobResult;
    selected: boolean;
    onSelect: () => void;
    onSave: () => void;
  }> = {},
) {
  return render(
    <TooltipProvider>
      <JobCard
        job={props.job ?? job}
        selected={props.selected ?? false}
        onSelect={props.onSelect ?? vi.fn()}
        onSave={props.onSave ?? vi.fn()}
      />
    </TooltipProvider>,
  );
}

describe("JobCard", () => {
  it("shows the canonical provider and additional source count", () => {
    renderCard();
    expect(screen.getByText(/Himalayas/)).toBeInTheDocument();
    expect(screen.getByText(/\+1 sources/)).toBeInTheDocument();
  });

  it("renders matched skills in API order and hides an empty list", () => {
    const { rerender } = render(
      <TooltipProvider>
        <JobCard
          job={{ ...job, matched_skills: ["Python", "PostgreSQL"] }}
          selected={false}
          onSelect={vi.fn()}
          onSave={vi.fn()}
        />
      </TooltipProvider>,
    );
    const chips = screen.getByLabelText("Matched skills");
    expect(Array.from(chips.children).map((el) => el.textContent)).toEqual([
      "Python",
      "PostgreSQL",
    ]);

    rerender(
      <TooltipProvider>
        <JobCard
          job={{ ...job, matched_skills: [] }}
          selected={false}
          onSelect={vi.fn()}
          onSave={vi.fn()}
        />
      </TooltipProvider>,
    );
    expect(screen.queryByLabelText("Matched skills")).not.toBeInTheDocument();
  });

  it("never displays the raw relevance score", () => {
    const { container } = renderCard();
    expect(container.textContent).not.toMatch(/42\.5/);
    expect(container.textContent).not.toMatch(/relevance_score/i);
  });

  it("labels the icon-only save control", () => {
    renderCard();
    const saves = screen.getAllByRole("button", {
      name: "Save Staff Engineer at Linear",
    });
    expect(saves.length).toBeGreaterThan(0);
    expect(saves[0]).toHaveAttribute(
      "aria-label",
      "Save Staff Engineer at Linear",
    );
  });

  it("renders a company logo when company_logo_url is present", () => {
    renderCard({
      job: {
        ...job,
        company_logo_url: "https://cdn.example.com/linear.png",
      },
    });
    expect(screen.getByTestId("company-logo")).toBeInTheDocument();
  });

  it("falls back to the letter tile when company_logo_url is absent", () => {
    renderCard();
    expect(screen.getByTestId("company-logo-fallback")).toHaveTextContent("L");
  });
});

describe("JobCard skeleton parity", () => {
  /**
   * The skeleton exists to stop the list reflowing when results arrive, which
   * only holds while it keeps the card's geometry. jsdom has no layout, so
   * assert the thing that would actually drift: both must render the same
   * shell class on the same primitive.
   */
  it("shares its shell geometry with the real card", () => {
    renderCard();
    const card = screen.getByTestId("job-card");

    for (const token of JOB_CARD_SHELL_CLASS.split(" ")) {
      expect(card).toHaveClass(token);
    }
    expect(card).toHaveAttribute("data-slot", "card");
    expect(card).toHaveAttribute("data-size", "sm");
  });
});
