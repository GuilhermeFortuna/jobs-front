import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FiltersPanel } from "@/components/job-scout/filters-panel";
import { DEFAULT_FILTERS } from "@/hooks/use-job-scout";
import type { ProviderDescriptor, SearchFilters } from "@/lib/api";

function renderPanel(
  providers?: ProviderDescriptor[],
  overrides?: {
    filters?: SearchFilters;
    setFilters?: (filters: SearchFilters) => void;
    onSearch?: () => void;
  },
) {
  const setFilters = overrides?.setFilters ?? vi.fn();
  const onSearch = overrides?.onSearch ?? vi.fn();
  render(
    <FiltersPanel
      filters={overrides?.filters ?? DEFAULT_FILTERS}
      setFilters={setFilters}
      onSearch={onSearch}
      onSaveDefaults={vi.fn()}
      providers={providers}
    />,
  );
  return { setFilters, onSearch };
}

afterEach(cleanup);

describe("FiltersPanel provider filter", () => {
  it("lists only the providers the backend reports", () => {
    renderPanel([
      { key: "himalayas", display_name: "Himalayas", state: "enabled" },
      { key: "remoteok", display_name: "Remote OK", state: "enabled" },
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
    renderPanel([
      { key: "newboard", display_name: "New Board", state: "enabled" },
    ]);

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
    expect(
      screen.getByRole("checkbox", { name: "Adzuna" }),
    ).toBeInTheDocument();
  });

  it("falls back to the known providers when the fetch returns nothing", () => {
    renderPanel([]);

    expect(
      screen.getByRole("checkbox", { name: "Jobicy" }),
    ).toBeInTheDocument();
  });

  it("shows unconfigured providers as unavailable and unselectable", () => {
    renderPanel([
      { key: "himalayas", display_name: "Himalayas", state: "enabled" },
      { key: "adzuna", display_name: "Adzuna", state: "unconfigured" },
    ]);

    const unavailable = screen.getByRole("checkbox", {
      name: "Adzuna · Unavailable",
    });
    expect(unavailable).toHaveAttribute("aria-disabled", "true");
    expect(screen.queryByText(/app_id|credential|api key/i)).toBeNull();
  });
});

describe("FiltersPanel location", () => {
  it("updates location without searching on each keystroke", () => {
    const setFilters = vi.fn();
    const onSearch = vi.fn();
    renderPanel(undefined, { setFilters, onSearch });

    fireEvent.change(screen.getByLabelText("Role location"), {
      target: { value: "Lisbon" },
    });
    expect(onSearch).not.toHaveBeenCalled();
    expect(setFilters).toHaveBeenCalledWith(
      expect.objectContaining({ location: "Lisbon" }),
    );
  });

  it("keeps role location distinct from eligible countries", () => {
    renderPanel(undefined, {
      filters: {
        ...DEFAULT_FILTERS,
        location: "Berlin",
        country: "Germany",
      },
    });

    expect(screen.getByLabelText("Role location")).toHaveValue("Berlin");
    expect(screen.getByLabelText("Eligible countries")).toBeInTheDocument();
    expect(
      screen.getByText(/Filters where the role is based/),
    ).toBeInTheDocument();
  });
});
