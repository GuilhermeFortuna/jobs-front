import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { DEMO_JOBS, isDemoJob, isDevPreviewEnabled } from "@/lib/demo-data";

describe("demo-data", () => {
  it("identifies preview jobs", () => {
    expect(isDemoJob("demo-linear")).toBe(true);
    expect(isDemoJob("job-1")).toBe(false);
  });

  it("exposes labeled preview jobs for offline development", () => {
    expect(DEMO_JOBS.length).toBeGreaterThan(0);
    expect(DEMO_JOBS[0]?.provider_job_id.startsWith("demo-")).toBe(true);
    expect(isDevPreviewEnabled()).toBe(process.env.NODE_ENV === "development");
  });
});

describe("localStorage profile memory", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("reads and writes remembered profile id", () => {
    const id = "11111111-1111-1111-1111-111111111111";
    localStorage.setItem("job-scout-profile", id);
    expect(localStorage.getItem("job-scout-profile")).toBe(id);
  });

  it("falls back when remembered profile is missing from list", () => {
    localStorage.setItem("job-scout-profile", "missing-id");
    const profiles = [{ id: "keep-me" }];
    const remembered = localStorage.getItem("job-scout-profile");
    const current =
      profiles.find((item) => item.id === remembered) ?? profiles[0];
    expect(current.id).toBe("keep-me");
  });
});

describe("polling generation cancellation", () => {
  it("ignores stale poll ticks when generation changes", async () => {
    let generation = 0;
    const apply = vi.fn();

    async function poll(id: string, tickGeneration: number) {
      if (tickGeneration !== generation) return;
      apply(id);
    }

    await poll("search-a", 0);
    expect(apply).toHaveBeenCalledWith("search-a");

    generation += 1;
    apply.mockClear();
    await poll("search-a", 0);
    expect(apply).not.toHaveBeenCalled();
  });
});
