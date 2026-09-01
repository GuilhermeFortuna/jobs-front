import { ApiError } from "@/lib/api-error";

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type SearchSort = "relevance" | "newest" | "salary";

export type SearchFilters = {
  query: string;
  country?: string | null;
  worldwide?: boolean | null;
  seniority: string[];
  employment_types: string[];
  providers: string[];
  minimum_salary?: number | null;
  posted_within_days?: number | null;
  sort: SearchSort;
};

export type AlternateSource = {
  provider: string;
  provider_job_id: string;
  job_url: string;
  apply_url: string | null;
};

export type ProviderDescriptor = {
  key: string;
  display_name: string;
};

export type ProviderSearchStatus = {
  provider: string;
  status: "loading" | "complete" | "failed";
  progress: number;
  checked_count: number;
};

export type Profile = {
  id: string;
  display_name: string;
  preferences: SearchFilters;
  created_at: string;
  updated_at: string;
};

export type ProfileCreate = {
  display_name: string;
  preferences?: SearchFilters;
};

export type ProfilePatch = {
  display_name?: string;
  preferences?: SearchFilters;
};

export type JobResult = {
  provider: string;
  provider_job_id: string;
  title: string;
  company: string;
  description?: string | null;
  location_text?: string | null;
  eligible_country_codes?: string[] | null;
  employment_type: string;
  remote_type: string;
  seniority?: string | null;
  salary_min_annual?: number | null;
  salary_max_annual?: number | null;
  salary_currency?: string | null;
  job_url: string;
  apply_url?: string | null;
  company_logo_url?: string | null;
  posted_at?: string | null;
  alternate_sources?: AlternateSource[];
};

export type SavedJob = JobResult & {
  id: string;
  profile_id: string;
  state: "saved" | "applied";
  saved_at: string;
  applied_at: string | null;
  updated_at: string;
};

/** @deprecated Use JobResult or SavedJob */
export type Job = SavedJob;

export type SearchPage = {
  search_id: string;
  status: "loading" | "complete" | "failed";
  progress: number;
  checked_count: number;
  providers: ProviderSearchStatus[];
  items: JobResult[];
  page: number;
  page_size: number;
  total: number | null;
  is_complete: boolean;
  is_partial: boolean;
  warnings: string[];
};

export type SearchRefreshPage = SearchPage & {
  previous_search_id: string | null;
  serving_search_id: string;
};

export type SavedJobCreate = {
  search_id: string;
  provider: string;
  provider_job_id: string;
  state?: "saved" | "applied";
};

export type LibraryState = "saved" | "applied";

function parseDetail(payload: unknown, status: number): string {
  if (payload && typeof payload === "object" && "detail" in payload) {
    const detail = (payload as { detail: unknown }).detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((item) =>
          item && typeof item === "object" && "msg" in item
            ? String((item as { msg: unknown }).msg)
            : "Validation error",
        )
        .join("; ");
    }
  }
  return `Request failed (${status})`;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new ApiError(response.status, parseDetail(payload, response.status));
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export const api = {
  health: () => request<{ status: string }>("/health"),

  profiles: () => request<Profile[]>("/profiles"),

  providers: () => request<ProviderDescriptor[]>("/providers"),

  getProfile: (profileId: string) => request<Profile>(`/profiles/${profileId}`),

  createProfile: (body: ProfileCreate) =>
    request<Profile>("/profiles", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateProfile: (profileId: string, body: ProfilePatch) =>
    request<Profile>(`/profiles/${profileId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  startSearch: (profile_id: string, filters?: SearchFilters) =>
    request<SearchPage>("/searches", {
      method: "POST",
      body: JSON.stringify({ profile_id, filters }),
    }),

  search: (
    searchId: string,
    profileId: string,
    options?: { page?: number; page_size?: number },
  ) => {
    const params = new URLSearchParams({ profile_id: profileId });
    if (options?.page) params.set("page", String(options.page));
    params.set("page_size", String(options?.page_size ?? 100));
    return request<SearchPage>(`/searches/${searchId}?${params.toString()}`);
  },

  refreshDefaultSearch: (profileId: string) =>
    request<SearchRefreshPage>(
      `/profiles/${profileId}/default-search/refresh`,
      { method: "POST" },
    ),

  library: (profileId: string, state?: LibraryState) => {
    const query = state ? `?state=${state}` : "";
    return request<SavedJob[]>(`/profiles/${profileId}/jobs${query}`);
  },

  getSavedJob: (profileId: string, jobId: string) =>
    request<SavedJob>(`/profiles/${profileId}/jobs/${jobId}`),

  save: (profileId: string, body: SavedJobCreate) =>
    request<SavedJob>(`/profiles/${profileId}/jobs`, {
      method: "POST",
      body: JSON.stringify(body),
    }),

  updateState: (profileId: string, jobId: string, state: LibraryState) =>
    request<SavedJob>(`/profiles/${profileId}/jobs/${jobId}`, {
      method: "PATCH",
      body: JSON.stringify({ state }),
    }),

  remove: (profileId: string, jobId: string) =>
    request<void>(`/profiles/${profileId}/jobs/${jobId}`, {
      method: "DELETE",
    }),
};
