"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  api,
  type LibraryState,
  type Profile,
  type SearchFilters,
  type SearchPage,
} from "@/lib/api";
import { ApiError, formatApiError } from "@/lib/api-error";
import { DEMO_JOBS, isDemoJob, isDevPreviewEnabled } from "@/lib/demo-data";
import {
  findJobIndex,
  isSavedJob,
  preserveSelection,
  type DisplayJob,
} from "@/lib/job-utils";
import {
  EMPTY_FILTERS,
  hasUrlFilters,
  resolveInitialFilters,
  syncFiltersToUrl,
} from "@/lib/search-params";

export type View = "discover" | "saved" | "applied";

export type StatusKind =
  | "idle"
  | "loading"
  | "partial"
  | "complete"
  | "failed"
  | "offline"
  | "expired"
  | "empty"
  | "validation";

const PROFILE_STORAGE_KEY = "job-scout-profile";
const POLL_INTERVAL_MS = 900;

const FALLBACK_FILTERS: SearchFilters = {
  ...EMPTY_FILTERS,
  query: "Staff software engineer",
  worldwide: true,
  seniority: ["Senior", "Manager"],
  employment_types: ["Full Time"],
  minimum_salary: 150000,
  sort: "relevance",
};

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = window.setTimeout(() => resolve(), ms);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

function buildNotice(page: SearchPage): string {
  if (page.status === "failed") {
    return page.warnings[0] ?? "Search stopped early";
  }
  if (page.is_complete) {
    return `Search complete · ${page.total ?? 0} matching roles`;
  }
  return "Searching Himalayas";
}

function statusKindFromPage(
  page: SearchPage | null,
  offline: boolean,
  expired: boolean,
): StatusKind {
  if (offline) return "offline";
  if (expired) return "expired";
  if (!page) return "idle";
  if (page.is_complete && page.items.length === 0) return "empty";
  if (page.status === "failed") return "failed";
  if (page.is_complete) return "complete";
  if (page.status === "loading")
    return page.items.length ? "partial" : "loading";
  return "loading";
}

export function useJobScout() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [view, setViewState] = useState<View>("discover");
  const [filters, setFiltersState] = useState<SearchFilters>(FALLBACK_FILTERS);
  const [jobs, setJobs] = useState<DisplayJob[]>([]);
  const [selected, setSelected] = useState<DisplayJob | null>(null);
  const [searchId, setSearchId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [checked, setChecked] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("Loading profiles…");
  const [statusKind, setStatusKind] = useState<StatusKind>("idle");
  const [apiOnline, setApiOnline] = useState(true);
  const [searchExpired, setSearchExpired] = useState(false);
  const [booted, setBooted] = useState(false);
  const [profileFallbackNotice, setProfileFallbackNotice] = useState<
    string | null
  >(null);
  const [deleteTarget, setDeleteTarget] = useState<DisplayJob | null>(null);

  const pollGeneration = useRef(0);
  const initGeneration = useRef(0);
  const selectedRef = useRef<DisplayJob | null>(null);
  const previousProfileId = useRef<string | null>(null);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const cancelPolling = useCallback(() => {
    pollGeneration.current += 1;
  }, []);

  const applySearchPage = useCallback((page: SearchPage, keepStale = false) => {
    setSearchId(page.search_id);
    setProgress(page.progress);
    setChecked(page.checked_count);
    setTotal(page.total);
    setWarnings(page.warnings);
    setNotice(buildNotice(page));
    setSearchExpired(false);
    setStatusKind(statusKindFromPage(page, false, false));

    setJobs((current) => {
      const nextItems = page.items;
      if (keepStale && current.length && !nextItems.length) {
        return current;
      }
      const next = nextItems as DisplayJob[];
      setSelected((prev) => preserveSelection(next, prev));
      return next;
    });
  }, []);

  const pollSearch = useCallback(
    async (id: string, generation: number, servingId?: string) => {
      let complete = false;
      while (!complete) {
        if (generation !== pollGeneration.current) return;
        try {
          const result = await api.search(servingId ?? id);
          if (generation !== pollGeneration.current) return;
          applySearchPage(result);
          complete = result.is_complete;
          if (!complete) {
            await sleep(POLL_INTERVAL_MS);
            if (generation !== pollGeneration.current) return;
          }
        } catch (error) {
          if (generation !== pollGeneration.current) return;
          if (error instanceof ApiError && error.isExpired) {
            setSearchExpired(true);
            setStatusKind("expired");
            setNotice("Search expired · run a new search to continue");
            setLoading(false);
            return;
          }
          setApiOnline(false);
          setStatusKind("offline");
          setNotice(formatApiError(error));
          setLoading(false);
          return;
        }
      }
      setLoading(false);
    },
    [applySearchPage],
  );

  const runSearch = useCallback(
    async (nextFilters?: SearchFilters) => {
      if (!profile) {
        setNotice("Start the backend to enable live search");
        setStatusKind("offline");
        return;
      }
      const activeFilters = nextFilters ?? filters;
      cancelPolling();
      const generation = pollGeneration.current;
      setLoading(true);
      setSearchExpired(false);
      setApiOnline(true);
      setStatusKind("loading");
      setNotice("Starting Himalayas search");
      setProgress(0);
      setChecked(0);
      setTotal(null);
      setWarnings([]);
      syncFiltersToUrl(activeFilters);

      try {
        const result = await api.startSearch(profile.id, activeFilters);
        if (generation !== pollGeneration.current) return;
        applySearchPage(result);
        await pollSearch(result.search_id, generation);
      } catch (error) {
        if (generation !== pollGeneration.current) return;
        setLoading(false);
        if (error instanceof ApiError && error.isValidation) {
          setStatusKind("validation");
        } else {
          setApiOnline(false);
          setStatusKind("offline");
        }
        setNotice(formatApiError(error));
      }
    },
    [applySearchPage, cancelPolling, filters, pollSearch, profile],
  );

  const refreshDefaultSearch = useCallback(async () => {
    if (!profile) return;
    cancelPolling();
    const generation = pollGeneration.current;
    setLoading(true);
    setSearchExpired(false);
    setApiOnline(true);
    setStatusKind("loading");
    setNotice("Refreshing default search");
    setWarnings([]);

    try {
      const result = await api.refreshDefaultSearch(profile.id);
      if (generation !== pollGeneration.current) return;
      const servingId = result.serving_search_id;
      applySearchPage(result, true);
      if (!result.is_complete) {
        await pollSearch(result.search_id, generation, servingId);
      } else {
        setLoading(false);
      }
    } catch (error) {
      if (generation !== pollGeneration.current) return;
      setLoading(false);
      if (error instanceof ApiError && error.isExpired) {
        setSearchExpired(true);
        setStatusKind("expired");
        setNotice("Search expired · run a new search to continue");
        return;
      }
      setApiOnline(false);
      setStatusKind("offline");
      setNotice(formatApiError(error));
    }
  }, [applySearchPage, cancelPolling, pollSearch, profile]);

  const loadLibrary = useCallback(
    async (state: LibraryState) => {
      if (!profile) return;
      cancelPolling();
      setLoading(true);
      setSearchId(null);
      setProgress(0);
      setChecked(0);
      setTotal(null);
      setWarnings([]);
      try {
        const library = await api.library(profile.id, state);
        setApiOnline(true);
        setJobs(library);
        setSelected(library[0] ?? null);
        setStatusKind(library.length ? "complete" : "empty");
        setNotice(
          `${library.length} ${state} role${library.length === 1 ? "" : "s"}`,
        );
      } catch (error) {
        setApiOnline(false);
        setStatusKind("offline");
        setNotice(formatApiError(error));
      } finally {
        setLoading(false);
      }
    },
    [cancelPolling, profile],
  );

  const changeView = useCallback(
    async (next: View) => {
      setViewState(next);
      if (next === "discover") {
        if (profile && booted) {
          await refreshDefaultSearch();
        }
        return;
      }
      await loadLibrary(next);
    },
    [booted, loadLibrary, profile, refreshDefaultSearch],
  );

  const setProfile = useCallback(
    (next: Profile) => {
      cancelPolling();
      setProfileState(next);
      localStorage.setItem(PROFILE_STORAGE_KEY, next.id);
      setProfileFallbackNotice(null);
      const urlParams = new URLSearchParams(window.location.search);
      const nextFilters = resolveInitialFilters(
        urlParams,
        next.preferences,
        FALLBACK_FILTERS,
      );
      setFiltersState(nextFilters);
      setViewState("discover");
    },
    [cancelPolling],
  );

  const setFilters = useCallback((next: SearchFilters) => {
    setFiltersState(next);
    syncFiltersToUrl(next);
  }, []);

  const saveJob = useCallback(
    async (state: LibraryState, target?: DisplayJob) => {
      const job = target ?? selected;
      if (!profile || !job) return;
      if (isDemoJob(job.provider_job_id)) {
        setNotice("Connect the API before saving preview roles");
        return;
      }
      try {
        let saved;
        if (isSavedJob(job)) {
          saved = await api.updateState(profile.id, job.id, state);
        } else {
          if (!searchId) {
            setNotice("Start a search before saving this role");
            return;
          }
          saved = await api.save(profile.id, {
            search_id: searchId,
            provider: job.provider,
            provider_job_id: job.provider_job_id,
            state,
          });
        }
        setApiOnline(true);
        setSelected(saved);
        setJobs((current) => {
          const index = findJobIndex(current, saved);
          if (index >= 0) {
            const copy = [...current];
            copy[index] = saved;
            return copy;
          }
          return current;
        });
        setNotice(
          state === "applied" ? "Marked as applied" : "Saved to your library",
        );
      } catch (error) {
        if (error instanceof ApiError && error.isExpired) {
          setSearchExpired(true);
          setStatusKind("expired");
          setNotice("Search expired · re-run search, then save again");
          return;
        }
        setNotice(formatApiError(error));
      }
    },
    [profile, searchId, selected],
  );

  const confirmDelete = useCallback((target: DisplayJob) => {
    if (!isSavedJob(target)) return;
    setDeleteTarget(target);
  }, []);

  const deleteJob = useCallback(async () => {
    if (!profile || !deleteTarget || !isSavedJob(deleteTarget)) return;
    try {
      await api.remove(profile.id, deleteTarget.id);
      const remaining = jobs.filter(
        (job) => !isSavedJob(job) || job.id !== deleteTarget.id,
      );
      setJobs(remaining);
      setSelected(preserveSelection(remaining, selectedRef.current));
      setDeleteTarget(null);
      setNotice("Removed permanently");
    } catch (error) {
      setNotice(formatApiError(error));
    }
  }, [deleteTarget, jobs, profile]);

  const saveDefaults = useCallback(async () => {
    if (!profile) return;
    try {
      const updated = await api.updateProfile(profile.id, {
        preferences: filters,
      });
      setProfileState(updated);
      setProfiles((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setNotice("Default search updated");
    } catch (error) {
      setNotice(formatApiError(error));
    }
  }, [filters, profile]);

  const createProfile = useCallback(
    async (displayName: string) => {
      try {
        const created = await api.createProfile({ display_name: displayName });
        setProfiles((current) => [...current, created]);
        setProfile(created);
        setNotice(`Profile "${created.display_name}" created`);
        return created;
      } catch (error) {
        setNotice(formatApiError(error));
        throw error;
      }
    },
    [setProfile],
  );

  const renameProfile = useCallback(
    async (displayName: string) => {
      if (!profile) return;
      try {
        const updated = await api.updateProfile(profile.id, {
          display_name: displayName,
        });
        setProfiles((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
        setProfileState(updated);
        setNotice("Profile renamed");
        return updated;
      } catch (error) {
        setNotice(formatApiError(error));
        throw error;
      }
    },
    [profile],
  );

  const retryConnection = useCallback(async () => {
    try {
      await api.health();
      setApiOnline(true);
      setNotice("Connected · refreshing search");
      if (view === "discover") {
        await refreshDefaultSearch();
      } else {
        await loadLibrary(view);
      }
    } catch {
      setApiOnline(false);
      setStatusKind("offline");
      setNotice("Backend is still offline");
    }
  }, [loadLibrary, refreshDefaultSearch, view]);

  useEffect(() => {
    const generation = ++initGeneration.current;
    let active = true;

    void (async () => {
      try {
        await api.health();
        if (!active || generation !== initGeneration.current) return;

        let values = await api.profiles();
        if (!values.length) {
          values = [await api.createProfile({ display_name: "Gui" })];
        }
        if (!active || generation !== initGeneration.current) return;

        const remembered = localStorage.getItem(PROFILE_STORAGE_KEY);
        const current =
          values.find((item) => item.id === remembered) ?? values[0];
        if (remembered && current.id !== remembered) {
          setProfileFallbackNotice(
            "Previously selected profile was removed · using the first available profile",
          );
        }

        const urlParams = new URLSearchParams(window.location.search);
        const initialFilters = resolveInitialFilters(
          urlParams,
          current.preferences,
          FALLBACK_FILTERS,
        );

        setProfiles(values);
        setProfileState(current);
        setFiltersState(initialFilters);
        setApiOnline(true);
        setBooted(true);
        setNotice("Ready to search Himalayas");
        previousProfileId.current = current.id;

        cancelPolling();
        const pollGen = pollGeneration.current;
        setLoading(true);
        setSearchExpired(false);
        setStatusKind("loading");
        setNotice("Refreshing default search");
        const result = await api.refreshDefaultSearch(current.id);
        if (!active || pollGen !== pollGeneration.current) return;
        applySearchPage(result, true);
        if (!result.is_complete) {
          await pollSearch(result.search_id, pollGen, result.serving_search_id);
        } else {
          setLoading(false);
        }
      } catch {
        if (!active || generation !== initGeneration.current) return;
        setApiOnline(false);
        setStatusKind("offline");
        if (isDevPreviewEnabled()) {
          setJobs(DEMO_JOBS);
          setSelected(DEMO_JOBS[0] ?? null);
          setNotice("Development preview · backend is offline");
        } else {
          setJobs([]);
          setSelected(null);
          setNotice("Backend is offline · retry when the API is available");
        }
      }
    })();

    return () => {
      active = false;
    };
    // Boot once; profile switches use the dedicated profile effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!profile || !booted) return;
    if (previousProfileId.current === profile.id) return;
    previousProfileId.current = profile.id;
    cancelPolling();
    setViewState("discover");
    const urlParams = new URLSearchParams(window.location.search);
    const nextFilters = hasUrlFilters(urlParams)
      ? resolveInitialFilters(urlParams, profile.preferences, FALLBACK_FILTERS)
      : resolveInitialFilters(
          new URLSearchParams(),
          profile.preferences,
          FALLBACK_FILTERS,
        );
    setFiltersState(nextFilters);
    void refreshDefaultSearch();
  }, [booted, cancelPolling, profile, refreshDefaultSearch]);

  return {
    profiles,
    profile,
    view,
    filters,
    jobs,
    selected,
    searchId,
    progress,
    checked,
    total,
    warnings,
    loading,
    notice,
    statusKind,
    apiOnline,
    searchExpired,
    profileFallbackNotice,
    deleteTarget,
    setDeleteTarget,
    setSelected,
    setFilters,
    setProfile,
    changeView,
    runSearch,
    refreshDefaultSearch,
    saveJob,
    confirmDelete,
    deleteJob,
    saveDefaults,
    createProfile,
    renameProfile,
    retryConnection,
  };
}

export { FALLBACK_FILTERS as DEFAULT_FILTERS };
