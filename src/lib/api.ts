export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type SearchFilters = {
  query: string;
  country?: string | null;
  worldwide?: boolean | null;
  seniority: string[];
  employment_types: string[];
  minimum_salary?: number | null;
  posted_within_days?: number | null;
  sort: "relevance" | "newest" | "salary";
};

export type Profile = {
  id: string;
  display_name: string;
  preferences: SearchFilters;
};

export type Job = {
  id?: string;
  profile_id?: string;
  provider: string;
  provider_job_id: string;
  state?: "saved" | "applied";
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
};

export type SearchPage = {
  search_id: string;
  status: "loading" | "complete" | "failed";
  progress: number;
  checked_count: number;
  items: Job[];
  total: number | null;
  is_complete: boolean;
  warnings: string[];
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.detail ?? `Request failed (${response.status})`);
  }
  return response.status === 204 ? (undefined as T) : response.json();
}

export const api = {
  profiles: () => request<Profile[]>("/profiles"),
  createProfile: (display_name: string) =>
    request<Profile>("/profiles", {
      method: "POST",
      body: JSON.stringify({ display_name }),
    }),
  updateProfile: (profileId: string, body: Partial<Profile>) =>
    request<Profile>(`/profiles/${profileId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  startSearch: (profile_id: string, filters: SearchFilters) =>
    request<SearchPage>("/searches", {
      method: "POST",
      body: JSON.stringify({ profile_id, filters }),
    }),
  search: (searchId: string) =>
    request<SearchPage>(`/searches/${searchId}?page_size=100`),
  library: (profileId: string, state: "saved" | "applied") =>
    request<Job[]>(`/profiles/${profileId}/jobs?state=${state}`),
  save: (profileId: string, job: Job, state: "saved" | "applied") =>
    request<Job>(`/profiles/${profileId}/jobs`, {
      method: "POST",
      body: JSON.stringify({ ...job, id: undefined, state }),
    }),
  updateState: (profileId: string, jobId: string, state: "saved" | "applied") =>
    request<Job>(`/profiles/${profileId}/jobs/${jobId}`, {
      method: "PATCH",
      body: JSON.stringify({ state }),
    }),
  remove: (profileId: string, jobId: string) =>
    request<void>(`/profiles/${profileId}/jobs/${jobId}`, { method: "DELETE" }),
};
