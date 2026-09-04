import type { SearchFilters, SearchSort } from "@/lib/api";

export const EMPTY_FILTERS: SearchFilters = {
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

/** Whether filters authorize an upstream provider search rather than only
 * changing local ordering or provider scope. Kept in sync with the API rule.
 */
export function hasSearchCriteria(filters: SearchFilters): boolean {
  return Boolean(
    filters.query.trim() ||
    filters.location.trim() ||
    filters.country ||
    filters.worldwide === true ||
    filters.seniority.length ||
    filters.employment_types.length ||
    filters.minimum_salary !== null ||
    filters.posted_within_days !== null,
  );
}

const SORT_VALUES: SearchSort[] = ["relevance", "newest", "salary"];

function isSort(value: string): value is SearchSort {
  return SORT_VALUES.includes(value as SearchSort);
}

function parseList(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function serializeList(values: string[]): string | null {
  if (!values.length) return null;
  return values.join(",");
}

export function hasUrlFilters(params: URLSearchParams): boolean {
  return [
    "q",
    "location",
    "country",
    "worldwide",
    "seniority",
    "employment",
    "providers",
    "salary",
    "posted",
    "sort",
  ].some((key) => params.has(key));
}

export function filtersFromSearchParams(
  params: URLSearchParams,
): SearchFilters {
  const sortParam = params.get("sort");
  const worldwideParam = params.get("worldwide");
  const salaryParam = params.get("salary");
  const postedParam = params.get("posted");

  return {
    query: params.get("q") ?? "",
    location: params.get("location") ?? "",
    country: params.get("country"),
    worldwide:
      worldwideParam === "1" ? true : worldwideParam === "0" ? false : null,
    seniority: parseList(params.get("seniority")),
    employment_types: parseList(params.get("employment")),
    providers: parseList(params.get("providers")),
    minimum_salary: salaryParam ? Number(salaryParam) || null : null,
    posted_within_days: postedParam ? Number(postedParam) || null : null,
    sort: sortParam && isSort(sortParam) ? sortParam : "relevance",
  };
}

export function searchParamsFromFilters(
  filters: SearchFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  const trimmedQuery = filters.query.trim();
  if (trimmedQuery) params.set("q", trimmedQuery);
  const trimmedLocation = filters.location.trim();
  if (trimmedLocation) params.set("location", trimmedLocation);
  if (filters.country) params.set("country", filters.country);
  if (filters.worldwide === true) params.set("worldwide", "1");
  if (filters.worldwide === false) params.set("worldwide", "0");
  const seniority = serializeList(filters.seniority);
  if (seniority) params.set("seniority", seniority);
  const employment = serializeList(filters.employment_types);
  if (employment) params.set("employment", employment);
  const providers = serializeList(filters.providers);
  if (providers) params.set("providers", providers);
  if (filters.minimum_salary)
    params.set("salary", String(filters.minimum_salary));
  if (filters.posted_within_days)
    params.set("posted", String(filters.posted_within_days));
  if (filters.sort !== "relevance") params.set("sort", filters.sort);
  return params;
}

export function mergeFilters(
  base: SearchFilters,
  override: Partial<SearchFilters>,
): SearchFilters {
  return {
    ...base,
    ...override,
    seniority: override.seniority ?? base.seniority,
    employment_types: override.employment_types ?? base.employment_types,
    providers: override.providers ?? base.providers,
  };
}

export function resolveInitialFilters(
  urlParams: URLSearchParams,
  profilePreferences: SearchFilters,
  fallback: SearchFilters,
): SearchFilters {
  if (hasUrlFilters(urlParams)) {
    return mergeFilters(fallback, filtersFromSearchParams(urlParams));
  }
  return mergeFilters(fallback, profilePreferences);
}

export function syncFiltersToUrl(filters: SearchFilters): void {
  const params = searchParamsFromFilters(filters);
  const next = params.toString();
  const url = next ? `?${next}` : window.location.pathname;
  window.history.replaceState(null, "", url);
}
