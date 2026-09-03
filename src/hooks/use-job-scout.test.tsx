import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useJobScout } from "@/hooks/use-job-scout";
import type { JobResult, Profile } from "@/lib/api";

const PROFILE_ID = "11111111-1111-1111-1111-111111111111";
const STALE_SEARCH_ID = "22222222-2222-2222-2222-222222222222";
const FRESH_SEARCH_ID = "33333333-3333-3333-3333-333333333333";

const profile: Profile = {
  id: PROFILE_ID,
  display_name: "Owner",
  preferences: {
    query: "profile default",
    location: "",
    country: null,
    worldwide: null,
    seniority: [],
    employment_types: [],
    providers: [],
    minimum_salary: null,
    posted_within_days: null,
    sort: "relevance",
  },
  skills: [],
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

function job(id: string, title: string): JobResult {
  return {
    provider: "himalayas",
    provider_job_id: id,
    title,
    company: "Acme",
    description: "Build things",
    location_text: "Remote worldwide",
    employment_type: "full_time",
    remote_type: "remote",
    seniority: "Senior",
    salary_min_annual: 100000,
    salary_max_annual: 200000,
    salary_currency: "USD",
    job_url: "https://himalayas.app/jobs/1",
    posted_at: "2026-01-10T00:00:00Z",
  };
}

function searchPage(overrides: Record<string, unknown> = {}) {
  return {
    search_id: STALE_SEARCH_ID,
    status: "complete",
    progress: 1,
    checked_count: 10,
    providers: [
      {
        provider: "himalayas",
        status: "complete",
        progress: 1,
        checked_count: 10,
      },
    ],
    items: [job("stale-1", "Stale role")],
    page: 1,
    page_size: 100,
    total: 1,
    is_complete: true,
    is_partial: false,
    warnings: [],
    ...overrides,
  };
}

type Route = { method: string; path: string; url: URL; body: unknown };

let routes: Route[] = [];
let handlers: Array<(route: Route) => unknown | undefined> = [];

function install() {
  routes = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: string, init?: RequestInit) => {
      const url = new URL(input);
      const route: Route = {
        method: init?.method ?? "GET",
        path: url.pathname,
        url,
        body: init?.body ? JSON.parse(String(init.body)) : undefined,
      };
      routes.push(route);
      for (const handler of handlers) {
        const result = handler(route);
        if (result !== undefined) {
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }
      }
      return new Response("null", {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }),
  );
}

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/");
  handlers = [
    (route) => (route.path === "/health" ? { status: "ok" } : undefined),
    (route) =>
      route.path === "/profiles" && route.method === "GET"
        ? [profile]
        : undefined,
  ];
  install();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useJobScout boot", () => {
  it("searches with the filters restored from the URL", async () => {
    window.history.replaceState(null, "", "/?q=designer&salary=200000");
    handlers.push((route) =>
      route.path === "/searches" && route.method === "POST"
        ? searchPage({ items: [job("url-1", "Designer role")] })
        : undefined,
    );
    handlers.push((route) =>
      route.path.endsWith("/default-search/refresh")
        ? searchPage({ serving_search_id: STALE_SEARCH_ID })
        : undefined,
    );

    const { result } = renderHook(() => useJobScout());

    await waitFor(() => expect(result.current.jobs.length).toBe(1), {
      timeout: 3000,
    });
    const started = routes.find(
      (route) => route.path === "/searches" && route.method === "POST",
    );
    expect(started).toBeDefined();
    expect(started?.body).toMatchObject({
      profile_id: PROFILE_ID,
      filters: { query: "designer", minimum_salary: 200000 },
    });
    expect(
      routes.some((route) => route.path.endsWith("/default-search/refresh")),
    ).toBe(false);
  });

  it("uses the profile default search when the URL has no filters", async () => {
    handlers.push((route) =>
      route.path.endsWith("/default-search/refresh")
        ? searchPage({ serving_search_id: STALE_SEARCH_ID })
        : undefined,
    );

    const { result } = renderHook(() => useJobScout());

    await waitFor(() => expect(result.current.jobs.length).toBe(1), {
      timeout: 3000,
    });
    expect(
      routes.some((route) => route.path.endsWith("/default-search/refresh")),
    ).toBe(true);
  });

  it("reports a partial search when a provider fails but results remain", async () => {
    handlers.push((route) =>
      route.path.endsWith("/default-search/refresh")
        ? searchPage({
            status: "complete",
            is_partial: true,
            providers: [
              {
                provider: "himalayas",
                status: "complete",
                progress: 1,
                checked_count: 10,
              },
              {
                provider: "jobicy",
                status: "failed",
                progress: 1,
                checked_count: 0,
              },
            ],
            warnings: ["jobicy: provider unavailable"],
            serving_search_id: STALE_SEARCH_ID,
          })
        : undefined,
    );

    const { result } = renderHook(() => useJobScout());

    await waitFor(() => expect(result.current.statusKind).toBe("partial"), {
      timeout: 3000,
    });
    expect(result.current.liveAnnouncement).toContain("partially complete");
  });

  it("reports a failed search as failed rather than empty", async () => {
    handlers.push((route) =>
      route.path.endsWith("/default-search/refresh")
        ? searchPage({
            status: "failed",
            items: [],
            total: 0,
            warnings: ["Himalayas page 1 failed"],
            serving_search_id: STALE_SEARCH_ID,
          })
        : undefined,
    );

    const { result } = renderHook(() => useJobScout());

    await waitFor(() => expect(result.current.statusKind).toBe("failed"), {
      timeout: 3000,
    });
  });
});

describe("useJobScout default-search refresh", () => {
  it("keeps stale results visible then swaps in the refreshed ones", async () => {
    let refreshes = 0;
    let freshPolls = 0;
    handlers.push((route) => {
      if (!route.path.endsWith("/default-search/refresh")) return undefined;
      refreshes += 1;
      if (refreshes === 1) {
        return searchPage({ serving_search_id: STALE_SEARCH_ID });
      }
      return searchPage({
        search_id: FRESH_SEARCH_ID,
        status: "loading",
        progress: 0,
        items: [],
        total: null,
        is_complete: false,
        previous_search_id: STALE_SEARCH_ID,
        serving_search_id: STALE_SEARCH_ID,
      });
    });
    handlers.push((route) => {
      if (!route.path.startsWith(`/searches/${FRESH_SEARCH_ID}`))
        return undefined;
      freshPolls += 1;
      if (freshPolls === 1) {
        return searchPage({
          search_id: FRESH_SEARCH_ID,
          status: "loading",
          progress: 0.5,
          items: [],
          total: null,
          is_complete: false,
        });
      }
      return searchPage({
        search_id: FRESH_SEARCH_ID,
        items: [job("fresh-1", "Fresh role")],
      });
    });
    handlers.push((route) =>
      route.path.startsWith(`/searches/${STALE_SEARCH_ID}`)
        ? searchPage()
        : undefined,
    );

    const { result } = renderHook(() => useJobScout());
    await waitFor(() => expect(result.current.jobs.length).toBe(1), {
      timeout: 3000,
    });
    expect(result.current.jobs[0].title).toBe("Stale role");

    await result.current.refreshDefaultSearch();

    await waitFor(
      () => expect(result.current.jobs[0]?.title).toBe("Fresh role"),
      { timeout: 5000 },
    );
    expect(freshPolls).toBeGreaterThan(0);
  });

  it("scopes every search read to the selected profile", async () => {
    handlers.push((route) =>
      route.path.endsWith("/default-search/refresh")
        ? searchPage({
            status: "loading",
            items: [],
            total: null,
            is_complete: false,
            serving_search_id: STALE_SEARCH_ID,
          })
        : undefined,
    );
    handlers.push((route) =>
      route.path.startsWith(`/searches/${STALE_SEARCH_ID}`)
        ? searchPage()
        : undefined,
    );

    renderHook(() => useJobScout());

    await waitFor(
      () =>
        expect(
          routes.some((route) => route.path.startsWith("/searches/")),
        ).toBe(true),
      { timeout: 3000 },
    );
    const read = routes.find((route) => route.path.startsWith("/searches/"));
    expect(read?.url.searchParams.get("profile_id")).toBe(PROFILE_ID);
  });
});
