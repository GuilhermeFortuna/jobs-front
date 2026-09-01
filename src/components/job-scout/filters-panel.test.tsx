import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FiltersPanel } from "@/components/job-scout/filters-panel";
import { DEFAULT_FILTERS } from "@/hooks/use-job-scout";
import type { ProviderDescriptor } from "@/lib/api";

function renderPanel(providers?: ProviderDescriptor[]) {
  render(
    <FiltersPanel
      filters={DEFAULT_FILTERS}
      setFilters={vi.fn()}
      onSearch={vi.fn()}
      onSaveDefaults={vi.fn()}
      providers={providers}
    />,
  );
}

afterEach(cleanup);

describe("FiltersPanel provider filter", () => {
  it("lists only the providers the backend reports as enabled", () => {
    renderPanel([
      { key: "himalayas", display_name: "Himalayas" },
      { key: "remoteok", display_name: "Remote OK" },
    ]);

    expect(
      screen.getByRole("checkbox", { name: "Himalayas" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Remote OK" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("checkbox", { name: "Jobicy" }),
    ).not.toBeInTheDocument();
  });

  it("uses a display name supplied by the backend for an unknown key", () => {
    renderPanel([{ key: "newboard", display_name: "New Board" }]);

    expect(
      screen.getByRole("checkbox", { name: "New Board" }),
    ).toBeInTheDocument();
  });

  it("falls back to the known providers before the list has loaded", () => {
    renderPanel(undefined);

    expect(
      screen.getByRole("checkbox", { name: "Himalayas" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Remote OK" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Jobicy" }),
    ).toBeInTheDocument();
  });

  it("falls back to the known providers when the fetch returns nothing", () => {
    renderPanel([]);

    expect(
      screen.getByRole("checkbox", { name: "Jobicy" }),
    ).toBeInTheDocument();
  });
});
