import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SearchStatus } from "@/components/job-scout/search-status";

describe("SearchStatus", () => {
  it("names failed providers in the partial banner", () => {
    render(
      <SearchStatus
        view="discover"
        loading={false}
        notice="Search partially complete · 1 roles · Jobicy unavailable"
        liveAnnouncement="Search partially complete · 1 roles · Jobicy unavailable"
        checked={100}
        progress={1}
        total={1}
        warnings={["jobicy: provider unavailable"]}
        providerStatuses={[
          {
            provider: "himalayas",
            status: "complete",
            progress: 1,
            checked_count: 80,
          },
          {
            provider: "jobicy",
            status: "failed",
            progress: 1,
            checked_count: 0,
          },
        ]}
        statusKind="partial"
        searchExpired={false}
        onRefresh={vi.fn()}
      />,
    );
    expect(screen.getAllByText(/Jobicy unavailable/).length).toBeGreaterThan(0);
    expect(screen.getByText("Himalayas")).toBeInTheDocument();
    expect(screen.getByText("Jobicy")).toBeInTheDocument();
  });

  it("shows a total-failure alert separately from partial completion", () => {
    render(
      <SearchStatus
        view="discover"
        loading={false}
        notice="All providers failed"
        liveAnnouncement="All providers failed"
        checked={0}
        progress={1}
        total={0}
        warnings={["All providers failed"]}
        providerStatuses={[]}
        statusKind="failed"
        searchExpired={false}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("All providers failed");
  });
});
