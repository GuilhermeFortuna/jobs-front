import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EmptyState } from "@/components/job-scout/empty-states";
import { SearchStatus } from "@/components/job-scout/search-status";
import { TooltipProvider } from "@/components/ui/tooltip";
import { isTransientNotice } from "@/components/job-scout/transient-notice";

afterEach(cleanup);

describe("isTransientNotice", () => {
  it("recognizes action outcomes that belong on toasts", () => {
    expect(isTransientNotice("Saved to your library")).toBe(true);
    expect(isTransientNotice('Profile "Gui" created')).toBe(true);
    expect(isTransientNotice("Search complete · 3 matching roles")).toBe(false);
  });
});

describe("SearchStatus toast coexistence", () => {
  it("keeps transient notices out of the strip so they are not announced twice", () => {
    render(
      <TooltipProvider>
        <SearchStatus
          view="discover"
          loading={false}
          notice="Saved to your library"
          liveAnnouncement=""
          checked={10}
          progress={1}
          total={3}
          warnings={[]}
          providerStatuses={[]}
          statusKind="complete"
          searchExpired={false}
        />
      </TooltipProvider>,
    );
    expect(screen.getByTestId("search-notice")).toHaveTextContent("");
  });

  it("scopes the failure alert even when a toast alert is also present", () => {
    const { container } = render(
      <TooltipProvider>
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
        />
      </TooltipProvider>,
    );
    const toast = document.createElement("div");
    toast.setAttribute("role", "alert");
    toast.textContent = "Saved to your library";
    document.body.appendChild(toast);

    try {
      expect(within(container).getByRole("alert")).toHaveTextContent(
        "All providers failed",
      );
      expect(within(container).getByTestId("search-notice")).toHaveTextContent(
        "All providers failed",
      );
      expect(toast.textContent).toBe("Saved to your library");
      expect(
        within(container).queryByText("Saved to your library"),
      ).not.toBeInTheDocument();
    } finally {
      toast.remove();
    }
  });
});

describe("EmptyState module", () => {
  it("renders discover empty and library empty copy", () => {
    const { rerender } = render(
      <EmptyState view="discover" statusKind="empty" onDiscover={vi.fn()} />,
    );
    expect(screen.getByText("No matching roles")).toBeInTheDocument();

    rerender(<EmptyState view="saved" onDiscover={vi.fn()} />);
    expect(screen.getByText("No saved roles yet")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Discover roles" }),
    ).toBeInTheDocument();
  });
});
