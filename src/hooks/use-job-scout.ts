"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  api,
  type LibraryState,
  type Profile,
  type ProviderDescriptor,
  type ProviderSearchStatus,
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
  announcementKey,
  buildNotice,
  statusKindFromPage,
  type StatusKind,
} from "@/lib/search-notice";
import {
  EMPTY_FILTERS,
  hasSearchCriteria,
  hasUrlFilters,
  resolveInitialFilters,
  syncFiltersToUrl,
} from "@/lib/search-params";

export type View = "discover" | "saved" | "applied";
export type ActionNotice = {
  id: number;
  message: string;
};

export type { StatusKind };

const PROFILE_STORAGE_KEY = "job-scout-profile";
const POLL_INTERVAL_MS = 900;
/**
 * Matches the backend's own default (`/searches/{id}` page_size default 25,
 * max 100). The previous value of 100 sat at the API ceiling, which meant
 * pagination only ever appeared past 100 results and the list stayed
 * effectively unbounded for almost every search.
 */
export const SEARCH_PAGE_SIZE = 25;

const FALLBACK_FILTERS: SearchFilters = { ...EMPTY_FILTERS };

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

export function useJobScout() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profile, setProfileState] = useState<Profile | null>(null);
  const [view, setViewState] = useState<View>("discover");
  const [filters, setFiltersState] = useState<SearchFilters>(FALLBACK_FILTERS);
  const [jobs, setJobs] = useState<DisplayJob[]>([]);
  const [selected, setSelected] = useState<DisplayJob | null>(null);
  const [searchId, setSearchId] = useState<string | null>(null);
  const [page, setPageState] = useState(1);
  const [progress, setProgress] = useState(0);
  const [checked, setChecked] = useState(0);
  const [total, setTotal] = useState<number | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [providerStatuses, setProviderStatuses] = useState<
    ProviderSearchStatus[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("Loading profiles…");
  const [actionNotice, setActionNotice] = useState<ActionNotice | null>(null);
  const [liveAnnouncement, setLiveAnnouncement] = useState("");
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
  const pageRef = useRef(1);
  const [providers, setProviders] = useState<ProviderDescriptor[]>([]);
  const previousProfileId = useRef<string | null>(null);
  const lastAnnouncementKey = useRef("");
  const actionNoticeId = useRef(0);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const cancelPolling = useCallback(() => {
    pollGeneration.current += 1;
  }, []);

  /** Shared expired/offline branch for every search fetch failure. */
  const handleSearchFailure = useCallback((error: unknown) => {
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
  }, []);

  const notifyAction = useCallback((message: string) => {
    actionNoticeId.current += 1;
    setActionNotice({ id: actionNoticeId.current, message });
  }, []);

  const applySearchPage = useCallback(
    (
      page: SearchPage,
      options?: { keepStale?: boolean; keepSelection?: boolean },
    ) => {
      const keepStale = options?.keepStale ?? false;
      const keepSelection = options?.keepSelection ?? false;
      setProgress(page.progress);
      setChecked(page.checked_count);
      setWarnings(page.warnings);
      setProviderStatuses(page.providers ?? []);
      setNotice(buildNotice(page));
      const nextKey = announcementKey(page);
      if (nextKey !== lastAnnouncementKey.current) {
        lastAnnouncementKey.current = nextKey;
        setLiveAnnouncement(buildNotice(page));
      }
      setSearchExpired(false);
      setStatusKind(statusKindFromPage(page, false, false));

      setJobs((current) => {
        const nextItems = page.items;
        if (keepStale && current.length && !nextItems.length) {
          // Stale results stay on screen, and stay saveable, until the
          // replacement search has something useful to show.
          return current;
        }
        const next = nextItems as DisplayJob[];
        setSearchId(page.search_id);
        setTotal(page.total);
        setSelected((prev) => {
          const preserved = preserveSelection(next, prev);
          // Paging is navigation, not a new result set: the open detail pane
          // must not silently swap to whichever role happens to lead the new
          // page just because the selection lives on the page we left.
          if (keepSelection && prev && findJobIndex(next, prev) === -1) {
            return prev;
          }
          return preserved;
        });
        return next;
      });
    },
    [],
  );

  const pollSearch = useCallback(
    async (
      id: string,
      generation: number,
      profileId: string,
      options?: { keepStale?: boolean; keepSelection?: boolean },
    ) => {
      let complete = false;
      while (!complete) {
        if (generation !== pollGeneration.current) return;
        try {
          const result = await api.search(id, profileId, {
            page: pageRef.current,
            page_size: SEARCH_PAGE_SIZE,
          });
          if (generation !== pollGeneration.current) return;
          applySearchPage(result, {
            keepStale: options?.keepStale,
            keepSelection: options?.keepSelection,
          });
          complete = result.is_complete;
          if (!complete) {
            await sleep(POLL_INTERVAL_MS);
            if (generation !== pollGeneration.current) return;
          }
        } catch (error) {
          if (generation !== pollGeneration.current) return;
          handleSearchFailure(error);
          return;
        }
      }
      setLoading(false);
    },
    [applySearchPage, handleSearchFailure],
  );

  const runSearch = useCallback(
    async (nextFilters?: SearchFilters) => {
      if (!profile) {
        setNotice("Start the backend to enable live search");
        setStatusKind("offline");
        return;
      }
      const activeFilters = nextFilters ?? filters;
      if (!hasSearchCriteria(activeFilters)) {
        setStatusKind("validation");
        setNotice("Add at least one job criterion before searching");
        return;
      }
      cancelPolling();
      const generation = pollGeneration.current;
      setPageState(1);
      pageRef.current = 1;
      setLoading(true);
      setSearchExpired(false);
      setApiOnline(true);
      setStatusKind("loading");
      setNotice("Starting search");
      setProgress(0);
      setChecked(0);
      setTotal(null);
      setWarnings([]);
      syncFiltersToUrl(activeFilters);

      try {
        const result = await api.startSearch(profile.id, activeFilters);
        if (generation !== pollGeneration.current) return;
        applySearchPage(result);
        if (!result.is_complete) {
          await pollSearch(result.search_id, generation, profile.id);
        } else {
          setLoading(false);
        }
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
    if (!hasSearchCriteria(profile.preferences)) {
      setStatusKind("validation");
      setNotice("Save at least one job criterion before refreshing defaults");
      return;
    }
    cancelPolling();
    const generation = pollGeneration.current;
    setPageState(1);
    pageRef.current = 1;
    setLoading(true);
    setSearchExpired(false);
    setApiOnline(true);
    setStatusKind("loading");
    setNotice("Refreshing default search");
    setWarnings([]);

    try {
      const result = await api.refreshDefaultSearch(profile.id);
      if (generation !== pollGeneration.current) return;
      applySearchPage(result, { keepStale: true });
      if (!result.is_complete) {
        await pollSearch(result.search_id, generation, profile.id, {
          keepStale: true,
        });
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

  const setPage = useCallback(
    async (nextPage: number) => {
      if (
        !profile ||
        !searchId ||
        nextPage < 1 ||
        nextPage === pageRef.current
      ) {
        return;
      }
      const previousPage = pageRef.current;
      cancelPolling();
      const generation = pollGeneration.current;
      setPageState(nextPage);
      pageRef.current = nextPage;
      setLoading(true);
      setApiOnline(true);
      try {
        const result = await api.search(searchId, profile.id, {
          page: nextPage,
          page_size: SEARCH_PAGE_SIZE,
        });
        if (generation !== pollGeneration.current) return;
        applySearchPage(result, { keepSelection: true });
        if (!result.is_complete) {
          await pollSearch(result.search_id, generation, profile.id, {
            keepSelection: true,
          });
        } else {
          setLoading(false);
        }
      } catch (error) {
        if (generation !== pollGeneration.current) return;
        setPageState(previousPage);
        pageRef.current = previousPage;
        handleSearchFailure(error);
      }
    },
    [
      applySearchPage,
      cancelPolling,
      handleSearchFailure,
      pollSearch,
      profile,
      searchId,
    ],
  );

  const loadLibrary = useCallback(
    async (state: LibraryState) => {
      if (!profile) return;
      const profileId = profile.id;
      cancelPolling();
      const generation = pollGeneration.current;
      setLoading(true);
      setSearchId(null);
      setProgress(0);
      setChecked(0);
      setTotal(null);
      setWarnings([]);
      try {
        const library = await api.library(profileId, state);
        if (generation !== pollGeneration.current) return;
        setApiOnline(true);
        setJobs(library);
        setSelected(library[0] ?? null);
        setStatusKind(library.length ? "complete" : "empty");
        setNotice(
          `${library.length} ${state} role${library.length === 1 ? "" : "s"}`,
        );
      } catch (error) {
        if (generation !== pollGeneration.current) return;
        setApiOnline(false);
        setStatusKind("offline");
        setNotice(formatApiError(error));
      } finally {
        if (generation === pollGeneration.current) {
          setLoading(false);
        }
      }
    },
    [cancelPolling, profile],
  );

  const changeView = useCallback(
    async (next: View) => {
      setViewState(next);
      if (next === "discover") {
        if (profile && booted) {
          await runSearch();
        }
        return;
      }
      await loadLibrary(next);
    },
    [booted, loadLibrary, profile, runSearch],
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
        const leavesLibrary =
          (view === "saved" || view === "applied") && saved.state !== view;
        setJobs((current) => {
          const index = findJobIndex(current, saved);
          if (index < 0) return current;
          if (leavesLibrary) {
            const remaining = current.filter(
              (_, itemIndex) => itemIndex !== index,
            );
            setSelected(preserveSelection(remaining, selectedRef.current));
            return remaining;
          }
          const copy = [...current];
          copy[index] = saved;
          return copy;
        });
        if (!leavesLibrary) {
          setSelected(saved);
        }
        notifyAction(
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
    [notifyAction, profile, searchId, selected, view],
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
      notifyAction("Removed permanently");
    } catch (error) {
      setNotice(formatApiError(error));
    }
  }, [deleteTarget, jobs, notifyAction, profile]);

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
      notifyAction("Default search updated");
    } catch (error) {
      setNotice(formatApiError(error));
    }
  }, [filters, notifyAction, profile]);

  const createProfile = useCallback(
    async (displayName: string) => {
      try {
        const created = await api.createProfile({ display_name: displayName });
        setProfiles((current) => [...current, created]);
        setProfile(created);
        notifyAction(`Profile "${created.display_name}" created`);
        return created;
      } catch (error) {
        setNotice(formatApiError(error));
        throw error;
      }
    },
    [notifyAction, setProfile],
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
        notifyAction("Profile renamed");
        return updated;
      } catch (error) {
        setNotice(formatApiError(error));
        throw error;
      }
    },
    [notifyAction, profile],
  );

  const updateSkills = useCallback(
    async (labels: string[]) => {
      if (!profile) return;
      try {
        const updated = await api.updateProfile(profile.id, {
          skills: labels.map((label) => ({ label })),
        });
        setProfiles((current) =>
          current.map((item) => (item.id === updated.id ? updated : item)),
        );
        setProfileState(updated);
        notifyAction("Skills updated · run Search to apply the new ranking");
        return updated;
      } catch (error) {
        setNotice(formatApiError(error));
        throw error;
      }
    },
    [notifyAction, profile],
  );

  const initializeFromApi = useCallback(async () => {
    const generation = ++initGeneration.current;
    let values = await api.profiles();
    if (!values.length) {
      values = [await api.createProfile({ display_name: "Gui" })];
    }
    if (generation !== initGeneration.current) return;

    const remembered = localStorage.getItem(PROFILE_STORAGE_KEY);
    const current = values.find((item) => item.id === remembered) ?? values[0];
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
    setNotice("Ready to search");
    previousProfileId.current = current.id;

    cancelPolling();
    setPageState(1);
    pageRef.current = 1;
    setLoading(false);
    setSearchExpired(false);
    setStatusKind("idle");
    setSearchId(null);
    setJobs([]);
    setSelected(null);
    setTotal(null);
    setWarnings([]);
    setProviderStatuses([]);
    setProgress(0);
    setChecked(0);
  }, [cancelPolling]);

  const retryConnection = useCallback(async () => {
    try {
      await api.health();
      setApiOnline(true);
      if (!profile) {
        setNotice("Connected · loading profiles");
        await initializeFromApi();
        return;
      }
      if (view === "discover") {
        setLoading(false);
        setStatusKind("idle");
        setNotice("Connected · ready to search");
      } else {
        await loadLibrary(view);
      }
    } catch {
      setApiOnline(false);
      setStatusKind("offline");
      setNotice("Backend is still offline");
    }
  }, [initializeFromApi, loadLibrary, profile, view]);

  useEffect(() => {
    let active = true;
    // Advisory only: the filter panel falls back to the known provider list,
    // so a failure here must never block boot.
    void api
      .providers()
      .then((values) => {
        if (active) setProviders(values);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        await api.health();
        if (!active) return;
        await initializeFromApi();
      } catch {
        if (!active) return;
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
  }, [initializeFromApi]);

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
    setLoading(false);
    setSearchId(null);
    setJobs([]);
    setSelected(null);
    setTotal(null);
    setWarnings([]);
    setProviderStatuses([]);
    setProgress(0);
    setChecked(0);
    setStatusKind("idle");
    setNotice("Ready to search");
  }, [booted, cancelPolling, profile]);

  return {
    providers,
    profiles,
    profile,
    view,
    filters,
    jobs,
    selected,
    searchId,
    page,
    pageSize: SEARCH_PAGE_SIZE,
    progress,
    checked,
    total,
    warnings,
    providerStatuses,
    loading,
    notice,
    actionNotice,
    liveAnnouncement,
    statusKind,
    apiOnline,
    searchExpired,
    canRefreshDefaultSearch: Boolean(
      profile && hasSearchCriteria(profile.preferences),
    ),
    profileFallbackNotice,
    deleteTarget,
    setDeleteTarget,
    setSelected,
    setFilters,
    setProfile,
    setPage,
    changeView,
    runSearch,
    refreshDefaultSearch,
    saveJob,
    confirmDelete,
    deleteJob,
    saveDefaults,
    createProfile,
    renameProfile,
    updateSkills,
    retryConnection,
  };
}

export { FALLBACK_FILTERS as DEFAULT_FILTERS };
