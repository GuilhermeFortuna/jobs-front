import { describe, expect, it } from "vitest";

import {
  filtersFromSearchParams,
  hasUrlFilters,
  resolveInitialFilters,
  searchParamsFromFilters,
} from "@/lib/search-params";
import type { SearchFilters } from "@/lib/api";

const base: SearchFilters = {
  query: "",
  country: null,
  worldwide: null,
  seniority: [],
  employment_types: [],
  minimum_salary: null,
  posted_within_days: null,
  sort: "relevance",
};

describe("search-params", () => {
  it("round-trips all meaningful filters through URL params", () => {
    const filters: SearchFilters = {
      query: "staff engineer",
      country: "Brazil",
      worldwide: false,
      seniority: ["Senior", "Manager"],
      employment_types: ["Full Time", "Contractor"],
      minimum_salary: 150000,
      posted_within_days: 7,
      sort: "salary",
    };
    const params = searchParamsFromFilters(filters);
    expect(filtersFromSearchParams(params)).toEqual(filters);
  });

  it("detects when URL overrides profile defaults", () => {
    const params = new URLSearchParams("q=backend&sort=newest");
    expect(hasUrlFilters(params)).toBe(true);
    const resolved = resolveInitialFilters(
      params,
      { ...base, query: "default" },
      base,
    );
    expect(resolved.query).toBe("backend");
    expect(resolved.sort).toBe("newest");
  });

  it("uses profile defaults when URL is empty", () => {
    const params = new URLSearchParams();
    const profilePrefs = {
      ...base,
      query: "django",
      worldwide: true,
    };
    const resolved = resolveInitialFilters(params, profilePrefs, base);
    expect(resolved.query).toBe("django");
    expect(resolved.worldwide).toBe(true);
  });
});
