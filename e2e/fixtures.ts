const PROFILE_ID = "11111111-1111-1111-1111-111111111111";
const SEARCH_ID = "22222222-2222-2222-2222-222222222222";
const JOB_ID = "33333333-3333-3333-3333-333333333333";

const consolidatedJob = {
  provider: "himalayas",
  provider_job_id: "job-1",
  title: "Staff Engineer",
  company: "Linear",
  description: "Build product infrastructure.",
  location_text: "Remote worldwide",
  employment_type: "full_time",
  remote_type: "remote",
  seniority: "Staff",
  salary_min_annual: 180000,
  salary_max_annual: 220000,
  salary_currency: "USD",
  job_url: "https://himalayas.app/jobs/1",
  apply_url: "https://himalayas.app/jobs/1/apply",
  posted_at: "2026-01-10T00:00:00Z",
  alternate_sources: [
    {
      provider: "remoteok",
      provider_job_id: "rok-1",
      job_url: "https://remoteok.com/remote-jobs/1",
      apply_url: "https://remoteok.com/remote-jobs/1",
    },
  ],
};

const providerStatuses = [
  {
    provider: "himalayas",
    status: "complete" as const,
    progress: 1,
    checked_count: 500,
  },
  {
    provider: "remoteok",
    status: "complete" as const,
    progress: 1,
    checked_count: 300,
  },
  {
    provider: "jobicy",
    status: "complete" as const,
    progress: 1,
    checked_count: 0,
  },
];

export const fixtures = {
  // Jobicy is deliberately absent: the deployment has it disabled, so the
  // provider filter must not offer it as selectable. Adzuna is reported as
  // unconfigured so the workspace can show it as unavailable.
  providerList: [
    { key: "himalayas", display_name: "Himalayas", state: "enabled" as const },
    { key: "remoteok", display_name: "Remote OK", state: "enabled" as const },
    { key: "adzuna", display_name: "Adzuna", state: "unconfigured" as const },
  ],
  profile: {
    id: PROFILE_ID,
    display_name: "Gui",
    preferences: {
      query: "staff engineer",
      location: "",
      country: null,
      worldwide: true,
      seniority: ["Senior"],
      employment_types: ["Full Time"],
      providers: [],
      minimum_salary: null,
      posted_within_days: null,
      sort: "relevance" as const,
    },
    skills: [],
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  },
  searchLoading: {
    search_id: SEARCH_ID,
    status: "loading" as const,
    progress: 0.4,
    checked_count: 400,
    providers: providerStatuses.map((entry) => ({
      ...entry,
      status: "loading" as const,
      progress: 0.4,
    })),
    page: 1,
    page_size: 100,
    total: null,
    is_complete: false,
    is_partial: false,
    warnings: [],
    items: [consolidatedJob],
  },
  searchComplete: {
    search_id: SEARCH_ID,
    status: "complete" as const,
    progress: 1,
    checked_count: 800,
    providers: providerStatuses,
    page: 1,
    page_size: 100,
    total: 1,
    is_complete: true,
    is_partial: false,
    warnings: [],
    items: [consolidatedJob],
  },
  searchPartialComplete: {
    search_id: SEARCH_ID,
    status: "complete" as const,
    progress: 1,
    checked_count: 800,
    providers: [
      providerStatuses[0],
      providerStatuses[1],
      {
        provider: "jobicy",
        status: "failed" as const,
        progress: 1,
        checked_count: 0,
      },
    ],
    page: 1,
    page_size: 100,
    total: 1,
    is_complete: true,
    is_partial: true,
    warnings: ["jobicy: provider unavailable"],
    items: [consolidatedJob],
  },
  searchRefreshComplete: {
    search_id: SEARCH_ID,
    status: "complete" as const,
    progress: 1,
    checked_count: 800,
    providers: providerStatuses,
    page: 1,
    page_size: 100,
    total: 1,
    is_complete: true,
    is_partial: false,
    warnings: [],
    previous_search_id: null,
    serving_search_id: SEARCH_ID,
    items: [consolidatedJob],
  },
  savedJob: {
    id: JOB_ID,
    profile_id: PROFILE_ID,
    provider: "himalayas",
    provider_job_id: "job-1",
    state: "saved" as const,
    saved_at: "2026-01-11T00:00:00Z",
    applied_at: null,
    updated_at: "2026-01-11T00:00:00Z",
    title: "Staff Engineer",
    company: "Linear",
    description: "Build product infrastructure.",
    location_text: "Remote worldwide",
    employment_type: "full_time",
    remote_type: "remote",
    seniority: "Staff",
    salary_min_annual: 180000,
    salary_max_annual: 220000,
    salary_currency: "USD",
    job_url: "https://himalayas.app/jobs/1",
    apply_url: "https://himalayas.app/jobs/1/apply",
    posted_at: "2026-01-10T00:00:00Z",
    alternate_sources: consolidatedJob.alternate_sources,
  },
};

export function jsonResponse(body: unknown, status = 200) {
  return {
    status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
