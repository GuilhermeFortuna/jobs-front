import {
  cleanup,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SearchStatus } from "@/components/job-scout/search-status";
import { TooltipProvider } from "@/components/ui/tooltip";

afterEach(cleanup);

function renderStatus(props: ComponentProps<typeof SearchStatus>) {
  return render(
    <TooltipProvider>
      <SearchStatus {...props} />
    </TooltipProvider>,
  );
}

async function expandDetails() {
  const toggle = screen.getByTestId("search-status-toggle");
  if (toggle.getAttribute("aria-expanded") === "false") {
    await userEvent.click(toggle);
  }
}

const baseProps = {
  view: "discover" as const,
  loading: false,
  notice: "",
  liveAnnouncement: "",
  checked: 0,
  progress: 0,
  total: null as number | null,
  warnings: [] as string[],
  providerStatuses: [] as ComponentProps<
    typeof SearchStatus
  >["providerStatuses"],
  statusKind: "idle" as const,
  searchExpired: false,
};

describe("SearchStatus", () => {
  it("names failed providers in the partial banner", async () => {
    renderStatus({
      ...baseProps,
      notice: "Search partially complete · 1 roles · Jobicy unavailable",
      liveAnnouncement:
        "Search partially complete · 1 roles · Jobicy unavailable",
      checked: 100,
      progress: 1,
      total: 1,
      warnings: ["jobicy: provider unavailable"],
      providerStatuses: [
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
      ],
      statusKind: "partial",
      onRefresh: vi.fn(),
    });
    expect(screen.getByTestId("search-status")).toHaveAttribute(
      "data-collapsed",
      "true",
    );
    expect(
      screen.queryByTestId("status-banner-partial"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("provider-status-list"),
    ).not.toBeInTheDocument();

    await expandDetails();

    expect(screen.getByTestId("status-banner-partial")).toBeInTheDocument();
    expect(screen.getAllByText(/Jobicy unavailable/).length).toBeGreaterThan(0);
    expect(screen.getByText("Himalayas")).toBeInTheDocument();
    expect(screen.getByText("Jobicy")).toBeInTheDocument();
  });

  it("auto-collapses provider details when a search finishes", async () => {
    const { rerender } = renderStatus({
      ...baseProps,
      loading: true,
      notice: "Searching…",
      liveAnnouncement: "Searching…",
      statusKind: "loading",
      progress: 0.5,
      checked: 40,
      providerStatuses: [
        {
          provider: "himalayas",
          status: "loading",
          progress: 0.5,
          checked_count: 40,
        },
      ],
    });

    expect(screen.getByTestId("provider-status-list")).toBeInTheDocument();
    expect(screen.getByLabelText("Search progress")).toBeInTheDocument();

    rerender(
      <TooltipProvider>
        <SearchStatus
          {...baseProps}
          notice="Search complete · 12 matching roles"
          liveAnnouncement="Search complete · 12 matching roles"
          statusKind="complete"
          total={12}
          progress={1}
          checked={100}
          providerStatuses={[
            {
              provider: "himalayas",
              status: "complete",
              progress: 1,
              checked_count: 100,
            },
          ]}
        />
      </TooltipProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("search-status")).toHaveAttribute(
        "data-collapsed",
        "true",
      );
    });
    expect(
      screen.queryByTestId("provider-status-list"),
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Search progress")).not.toBeInTheDocument();
    expect(screen.getByTestId("search-notice")).toHaveTextContent(
      "Search complete · 12 matching roles",
    );
  });

  it("shows a total-failure alert separately from partial completion", () => {
    const { container } = renderStatus({
      ...baseProps,
      notice: "All providers failed",
      liveAnnouncement: "All providers failed",
      progress: 1,
      total: 0,
      warnings: ["All providers failed"],
      statusKind: "failed",
    });
    expect(within(container).getByRole("alert")).toHaveTextContent(
      "All providers failed",
    );
    expect(screen.getByTestId("status-banner-failed")).toBeInTheDocument();
  });

  it("scopes the failure alert query even when another alert (e.g. a toast) is on the page", () => {
    const { container } = renderStatus({
      ...baseProps,
      notice: "All providers failed",
      liveAnnouncement: "All providers failed",
      progress: 1,
      total: 0,
      warnings: ["All providers failed"],
      statusKind: "failed",
    });
    const toast = document.createElement("div");
    toast.setAttribute("role", "alert");
    toast.textContent = "Saved to your library";
    document.body.appendChild(toast);

    try {
      expect(within(container).getByRole("alert")).toHaveTextContent(
        "All providers failed",
      );
    } finally {
      toast.remove();
    }
  });

  it.each([
    {
      name: "warning",
      props: {
        statusKind: "complete" as const,
        warnings: ["Rate limited"],
        notice: "Search complete",
      },
      banner: "status-banner-warning",
      foldedWhenCollapsed: false,
    },
    {
      name: "expired",
      props: {
        statusKind: "complete" as const,
        searchExpired: true,
        notice: "Search complete",
        onRunSearch: vi.fn(),
      },
      banner: "status-banner-expired",
      foldedWhenCollapsed: false,
    },
    {
      name: "offline",
      props: {
        statusKind: "offline" as const,
        notice: "API unavailable",
        onRetry: vi.fn(),
      },
      banner: "status-banner-offline",
      foldedWhenCollapsed: false,
    },
    {
      name: "validation",
      props: {
        statusKind: "validation" as const,
        notice: "Query is required",
      },
      banner: "status-banner-validation",
      foldedWhenCollapsed: false,
    },
  ])(
    "renders the $name banner variant",
    async ({ props, banner, foldedWhenCollapsed }) => {
      renderStatus({ ...baseProps, ...props });
      if (foldedWhenCollapsed) {
        expect(screen.queryByTestId(banner)).not.toBeInTheDocument();
        await expandDetails();
      }
      expect(screen.getByTestId(banner)).toBeInTheDocument();
    },
  );

  it("preserves the aria-live announcement region", () => {
    renderStatus({
      ...baseProps,
      liveAnnouncement: "Search complete · 3 matching roles",
      notice: "Search complete · 3 matching roles",
      statusKind: "complete",
      total: 3,
      progress: 1,
    });
    const live = screen.getByText("Search complete · 3 matching roles", {
      selector: "[aria-live]",
    });
    expect(live).toHaveAttribute("aria-live", "polite");
  });

  it("shows exact totals only when a search is complete", () => {
    const { rerender } = renderStatus({
      ...baseProps,
      loading: true,
      notice: "Searching…",
      liveAnnouncement: "Searching…",
      statusKind: "loading",
      total: null,
      progress: 0.4,
      checked: 20,
    });
    expect(screen.getByTestId("search-notice").textContent).not.toMatch(
      /\d+ matching roles/,
    );

    rerender(
      <TooltipProvider>
        <SearchStatus
          {...baseProps}
          notice="Search complete · 12 matching roles"
          liveAnnouncement="Search complete · 12 matching roles"
          statusKind="complete"
          total={12}
          progress={1}
          checked={100}
        />
      </TooltipProvider>,
    );
    expect(screen.getByTestId("search-notice")).toHaveTextContent(
      "Search complete · 12 matching roles",
    );
  });

  it("keeps status information under reduced motion while loading", () => {
    vi.stubGlobal(
      "matchMedia",
      (query: string) =>
        ({
          matches: query === "(prefers-reduced-motion: reduce)",
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) satisfies MediaQueryList,
    );

    renderStatus({
      ...baseProps,
      loading: true,
      notice: "Searching providers…",
      liveAnnouncement: "Searching providers…",
      statusKind: "loading",
      progress: 0.5,
      checked: 40,
      providerStatuses: [
        {
          provider: "himalayas",
          status: "loading",
          progress: 0.5,
          checked_count: 40,
        },
      ],
    });

    expect(
      screen.queryByTestId("search-in-progress-expressive"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("search-notice")).toHaveTextContent(
      "Searching providers…",
    );
    expect(screen.getByLabelText("Provider search status")).toBeInTheDocument();
    expect(screen.getByLabelText("Search progress")).toBeInTheDocument();
    expect(
      within(screen.getByLabelText("Provider search status")).getByText(
        "40 checked",
      ),
    ).toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it("shows the expressive in-progress treatment when motion is allowed", () => {
    vi.stubGlobal(
      "matchMedia",
      (query: string) =>
        ({
          matches: false,
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) satisfies MediaQueryList,
    );

    renderStatus({
      ...baseProps,
      loading: true,
      notice: "Searching…",
      liveAnnouncement: "Searching…",
      statusKind: "loading",
      progress: 0.3,
      checked: 10,
      providerStatuses: [
        {
          provider: "himalayas",
          status: "loading",
          progress: 0.3,
          checked_count: 10,
        },
      ],
    });

    expect(
      screen.getByTestId("search-in-progress-expressive"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("ai-loading")).toBeInTheDocument();
    expect(screen.getByLabelText("Loading progress: 30%")).toBeInTheDocument();
    expect(screen.getByLabelText("Provider search status")).toBeInTheDocument();
    expect(screen.getByLabelText("Search progress")).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});
