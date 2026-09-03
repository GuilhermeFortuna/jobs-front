import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FiltersPanel } from "@/components/job-scout/filters-panel";
import { DEFAULT_FILTERS } from "@/hooks/use-job-scout";
import type { ProviderDescriptor, SearchFilters } from "@/lib/api";
import {
  filtersFromSearchParams,
  searchParamsFromFilters,
} from "@/lib/search-params";

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

describe("FiltersPanel actions and upgraded controls", () => {
  it("resets filters to the defaults", () => {
    const setFilters = vi.fn();
    renderPanel(undefined, {
      filters: {
        ...DEFAULT_FILTERS,
        query: "designer",
        employment_types: ["Full Time"],
        minimum_salary: 100000,
      },
      setFilters,
    });

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    expect(setFilters).toHaveBeenCalledWith(DEFAULT_FILTERS);
  });

  it("searches and saves defaults without inventing a debounce timer", () => {
    const onSearch = vi.fn();
    const onSaveDefaults = vi.fn();
    render(
      <FiltersPanel
        filters={DEFAULT_FILTERS}
        setFilters={vi.fn()}
        onSearch={onSearch}
        onSaveDefaults={onSaveDefaults}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /Search these roles/i }),
    );
    fireEvent.click(screen.getByRole("button", { name: /Save as default/i }));
    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSaveDefaults).toHaveBeenCalledTimes(1);
  });

  it("toggles employment type through the toggle group with unchanged values", () => {
    const setFilters = vi.fn();
    renderPanel(undefined, { setFilters });

    fireEvent.click(screen.getByRole("button", { name: "Full Time" }));
    expect(setFilters).toHaveBeenCalledWith(
      expect.objectContaining({ employment_types: ["Full Time"] }),
    );
  });

  it("maps the salary slider to the same discrete values as the old select", () => {
    renderPanel(undefined, {
      filters: { ...DEFAULT_FILTERS, minimum_salary: 150000 },
    });

    expect(screen.getByText("$150,000")).toBeInTheDocument();
    expect(screen.getByLabelText("Minimum salary")).toBeInTheDocument();
  });
});

describe("FiltersPanel URL round-trip for controls that changed type", () => {
  /**
   * JE-020 moved employment type and seniority from checkboxes to toggle
   * groups and minimum salary from a select to a slider. AC2 requires the
   * serialized values to be unchanged, so drive each control and push what it
   * produces through the real serializer and parser.
   */
  function roundTrip(filters: SearchFilters): SearchFilters {
    return filtersFromSearchParams(searchParamsFromFilters(filters));
  }

  it("round-trips employment types set through the toggle group", () => {
    const setFilters = vi.fn();
    renderPanel(undefined, { setFilters });

    fireEvent.click(screen.getByRole("button", { name: "Full Time" }));
    const next = setFilters.mock.calls.at(-1)![0] as SearchFilters;

    expect(next.employment_types).toEqual(["Full Time"]);
    expect(roundTrip(next)).toEqual(next);
  });

  it("round-trips seniority set through the toggle group", () => {
    const setFilters = vi.fn();
    renderPanel(undefined, { setFilters });

    fireEvent.click(screen.getByRole("button", { name: "Executive" }));
    const next = setFilters.mock.calls.at(-1)![0] as SearchFilters;

    expect(next.seniority).toEqual(["Executive"]);
    expect(roundTrip(next)).toEqual(next);
  });

  it("round-trips every salary stop the slider can produce", () => {
    for (const salary of [null, 100000, 150000, 200000]) {
      const filters: SearchFilters = {
        ...DEFAULT_FILTERS,
        minimum_salary: salary,
      };
      expect(roundTrip(filters).minimum_salary).toBe(salary);
    }
  });

  it("serializes salary identically to the select it replaced", () => {
    const filters: SearchFilters = {
      ...DEFAULT_FILTERS,
      minimum_salary: 150000,
    };
    expect(searchParamsFromFilters(filters).get("salary")).toBe("150000");
  });

  it("restores a slider value from the URL without mutating it", () => {
    const params = new URLSearchParams(
      "employment=Full+Time&seniority=Senior&salary=200000",
    );
    const restored = filtersFromSearchParams(params);
    renderPanel(undefined, { filters: restored });

    expect(screen.getByText("$200,000")).toBeInTheDocument();
    expect(roundTrip(restored)).toEqual(restored);
  });
});
