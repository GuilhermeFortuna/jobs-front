import { describe, expect, it } from "vitest";

import {
  filtersFromSearchParams,
  hasSearchCriteria,
  hasUrlFilters,
  resolveInitialFilters,
  searchParamsFromFilters,
} from "@/lib/search-params";
import type { SearchFilters } from "@/lib/api";

const base: SearchFilters = {
  query: "",
  location: "",
  country: null,
  worldwide: null,
  seniority: [],
  employment_types: [],
  providers: [],
  minimum_salary: null,
  posted_within_days: null,
  sort: "relevance",
};

describe("search-params", () => {
  it("requires a substantive criterion rather than provider or sort state", () => {
    expect(hasSearchCriteria(base)).toBe(false);
    expect(hasSearchCriteria({ ...base, providers: ["remoteok"] })).toBe(false);
    expect(hasSearchCriteria({ ...base, sort: "newest" })).toBe(false);
    expect(hasSearchCriteria({ ...base, query: "python" })).toBe(true);
    expect(hasSearchCriteria({ ...base, location: "Lisbon" })).toBe(true);
    expect(hasSearchCriteria({ ...base, country: "Brazil" })).toBe(true);
    expect(hasSearchCriteria({ ...base, worldwide: true })).toBe(true);
    expect(hasSearchCriteria({ ...base, seniority: ["Senior"] })).toBe(true);
    expect(
      hasSearchCriteria({ ...base, employment_types: ["Full Time"] }),
    ).toBe(true);
    expect(hasSearchCriteria({ ...base, minimum_salary: 100_000 })).toBe(true);
    expect(hasSearchCriteria({ ...base, posted_within_days: 7 })).toBe(true);
  });
  it("round-trips all meaningful filters through URL params", () => {
    const filters: SearchFilters = {
      query: "staff engineer",
      location: "Lisbon",
      country: "Brazil",
      worldwide: false,
      seniority: ["Senior", "Manager"],
      employment_types: ["Full Time", "Contractor"],
      providers: ["himalayas", "remoteok"],
      minimum_salary: 150000,
      posted_within_days: 7,
      sort: "salary",
    };
    const params = searchParamsFromFilters(filters);
    expect(filtersFromSearchParams(params)).toEqual(filters);
  });

  it("round-trips location independently from country", () => {
    const filters: SearchFilters = {
      ...base,
      location: "Berlin",
      country: "Germany",
    };
    const params = searchParamsFromFilters(filters);
    expect(params.get("location")).toBe("Berlin");
    expect(params.get("country")).toBe("Germany");
    expect(filtersFromSearchParams(params).location).toBe("Berlin");
    expect(filtersFromSearchParams(params).country).toBe("Germany");
  });

  it("detects when URL overrides profile defaults", () => {
    const params = new URLSearchParams("q=backend&sort=newest&location=Remote");
    expect(hasUrlFilters(params)).toBe(true);
    const resolved = resolveInitialFilters(
      params,
      { ...base, query: "default" },
      base,
    );
    expect(resolved.query).toBe("backend");
    expect(resolved.sort).toBe("newest");
    expect(resolved.location).toBe("Remote");
  });

  it("uses profile defaults when URL is empty", () => {
    const params = new URLSearchParams();
    const profilePrefs = {
      ...base,
      query: "django",
      worldwide: true,
      location: "Europe",
    };
    const resolved = resolveInitialFilters(params, profilePrefs, base);
    expect(resolved.query).toBe("django");
    expect(resolved.worldwide).toBe(true);
    expect(resolved.location).toBe("Europe");
  });
});
