import { describe, expect, it } from "vitest";

import type { SearchPage } from "@/lib/api";
import {
  announcementKey,
  buildNotice,
  statusKindFromPage,
} from "@/lib/search-notice";

function page(overrides: Partial<SearchPage> = {}): SearchPage {
  return {
    search_id: "search-1",
    status: "loading",
    progress: 0.5,
    checked_count: 10,
    providers: [
      {
        provider: "himalayas",
        status: "loading",
        progress: 0.5,
        checked_count: 10,
      },
    ],
    items: [],
    page: 1,
    page_size: 100,
    total: null,
    is_complete: false,
    is_partial: false,
    warnings: [],
    ...overrides,
  };
}

describe("search-notice", () => {
  it("marks completed partial searches as partial", () => {
    const result = page({
      status: "complete",
      is_complete: true,
      is_partial: true,
      total: 3,
      items: [
        {
          provider: "himalayas",
          provider_job_id: "1",
          title: "Role",
          company: "Acme",
          employment_type: "full_time",
          remote_type: "remote",
          job_url: "https://example.com",
        },
      ],
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
    });
    expect(statusKindFromPage(result, false, false)).toBe("partial");
    expect(buildNotice(result)).toContain("partially complete");
    expect(buildNotice(result)).toContain("Jobicy unavailable");
  });

  it("marks total failures separately from partial completion", () => {
    const failed = page({
      status: "failed",
      is_complete: true,
      is_partial: false,
      items: [],
      warnings: ["All providers failed"],
    });
    expect(statusKindFromPage(failed, false, false)).toBe("failed");
  });

  it("keeps in-progress searches in loading state even with items", () => {
    const loading = page({
      items: [
        {
          provider: "himalayas",
          provider_job_id: "1",
          title: "Role",
          company: "Acme",
          employment_type: "full_time",
          remote_type: "remote",
          job_url: "https://example.com",
        },
      ],
    });
    expect(statusKindFromPage(loading, false, false)).toBe("loading");
  });

  it("changes announcement keys on meaningful transitions", () => {
    const loading = announcementKey(page());
    const partial = announcementKey(
      page({
        status: "complete",
        is_complete: true,
        is_partial: true,
        total: 1,
        providers: [
          {
            provider: "jobicy",
            status: "failed",
            progress: 1,
            checked_count: 0,
          },
        ],
      }),
    );
    expect(loading).not.toBe(partial);
  });
});
