"use client";

import {
  Bookmark,
  BookmarkCheck,
  BriefcaseBusiness,
  CheckCircle2,
  ExternalLink,
  Filter,
  Globe2,
  LoaderCircle,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { api, type Job, type Profile, type SearchFilters } from "@/lib/api";
import { cn } from "@/lib/utils";

const defaultFilters: SearchFilters = {
  query: "Staff software engineer",
  country: null,
  worldwide: true,
  seniority: ["Senior", "Manager"],
  employment_types: ["Full Time"],
  minimum_salary: 150000,
  posted_within_days: null,
  sort: "relevance",
};

const demoJobs: Job[] = [
  [
    "demo-linear",
    "Linear",
    "Staff Software Engineer",
    180000,
    230000,
    "Remote worldwide",
  ],
  [
    "demo-vercel",
    "Vercel",
    "Staff Software Engineer",
    180000,
    220000,
    "Remote worldwide",
  ],
  [
    "demo-supabase",
    "Supabase",
    "Senior Backend Engineer",
    170000,
    210000,
    "Remote · Americas",
  ],
  [
    "demo-posthog",
    "PostHog",
    "Product Engineer",
    160000,
    200000,
    "Remote worldwide",
  ],
].map(([id, company, title, min, max, location]) => ({
  provider: "himalayas",
  provider_job_id: String(id),
  title: String(title),
  company: String(company),
  description:
    "Help teams build better products. You will design and ship core capabilities, own projects end-to-end, and improve the reliability and craft of the engineering experience.\n\nWhat you’ll do\n• Design systems used by product teams every day.\n• Collaborate closely with product and design.\n• Raise the bar for performance, clarity, and quality.",
  location_text: String(location),
  employment_type: "full_time",
  remote_type: "remote",
  seniority: "Staff",
  salary_min_annual: Number(min),
  salary_max_annual: Number(max),
  salary_currency: "USD",
  job_url: "https://himalayas.app/jobs",
}));

type View = "discover" | "saved" | "applied";

let bootProfilesPromise: Promise<Profile[]> | null = null;

function loadProfiles() {
  if (!bootProfilesPromise) {
    bootProfilesPromise = api
      .profiles()
      .then(async (profiles) =>
        profiles.length ? profiles : [await api.createProfile("Gui")],
      );
  }
  return bootProfilesPromise;
}

function money(job: Job) {
  const compact = (value: number) => `$${Math.round(value / 1000)}k`;
  if (job.salary_min_annual && job.salary_max_annual)
    return `${compact(job.salary_min_annual)}–${compact(job.salary_max_annual)}`;
  if (job.salary_min_annual) return `From ${compact(job.salary_min_annual)}`;
  return "Salary not listed";
}

function age(value?: string | null) {
  if (!value) return "Recently posted";
  const days = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000),
  );
  return days === 0 ? "Today" : `${days}d ago`;
}

export function JobScout() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [view, setView] = useState<View>("discover");
  const [filters, setFilters] = useState(defaultFilters);
  const [jobs, setJobs] = useState<Job[]>(demoJobs);
  const [selected, setSelected] = useState<Job>(demoJobs[0]);
  const [searchId, setSearchId] = useState<string | null>(null);
  const [progress, setProgress] = useState(0.68);
  const [checked, setChecked] = useState(1240);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState("Preview data · connecting to the API");
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const values = await loadProfiles();
        const remembered = localStorage.getItem("job-scout-profile");
        const current =
          values.find((item) => item.id === remembered) ?? values[0];
        if (!active) return;
        setProfiles(values);
        setProfile(current);
        setFilters({ ...defaultFilters, ...current.preferences });
        setNotice("Ready to search Himalayas");
      } catch {
        setNotice("Preview data · backend is offline");
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function poll(id: string) {
    let complete = false;
    while (!complete) {
      const result = await api.search(id);
      setJobs(result.items);
      if (result.items.length) setSelected(result.items[0]);
      setProgress(result.progress);
      setChecked(result.checked_count);
      setTotal(result.total);
      setNotice(
        result.status === "failed"
          ? (result.warnings[0] ?? "Search stopped early")
          : result.is_complete
            ? `Search complete · ${result.total ?? 0} matching roles`
            : "Searching Himalayas",
      );
      complete = result.is_complete;
      if (!complete)
        await new Promise((resolve) => window.setTimeout(resolve, 900));
    }
    setLoading(false);
  }

  async function runSearch() {
    if (!profile) {
      setNotice("Start the backend to enable live search");
      return;
    }
    setLoading(true);
    setNotice("Starting Himalayas search");
    setProgress(0);
    setTotal(null);
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (filters.minimum_salary)
      params.set("salary", String(filters.minimum_salary));
    window.history.replaceState(null, "", `?${params}`);
    try {
      const result = await api.startSearch(profile.id, filters);
      setSearchId(result.search_id);
      await poll(result.search_id);
    } catch (error) {
      setLoading(false);
      setNotice(error instanceof Error ? error.message : "Search failed");
    }
  }

  async function changeView(next: View) {
    setView(next);
    if (next === "discover" || !profile) return;
    try {
      const library = await api.library(profile.id, next);
      setJobs(library);
      if (library[0]) setSelected(library[0]);
      setNotice(
        `${library.length} ${next} role${library.length === 1 ? "" : "s"}`,
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Library unavailable");
    }
  }

  async function save(state: "saved" | "applied") {
    if (!profile || selected.provider_job_id.startsWith("demo-")) {
      setNotice("Connect the API before saving this preview role");
      return;
    }
    try {
      const saved = selected.id
        ? await api.updateState(profile.id, selected.id, state)
        : await api.save(profile.id, selected, state);
      setSelected(saved);
      setJobs((current) =>
        current.map((job) =>
          job.provider_job_id === saved.provider_job_id ? saved : job,
        ),
      );
      setNotice(
        state === "applied" ? "Marked as applied" : "Saved to your library",
      );
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not save role");
    }
  }

  async function removeSelected() {
    if (!profile || !selected.id) return;
    await api.remove(profile.id, selected.id);
    const remaining = jobs.filter((job) => job.id !== selected.id);
    setJobs(remaining);
    if (remaining[0]) setSelected(remaining[0]);
    setNotice("Removed permanently");
  }

  async function saveDefaults() {
    if (!profile) return;
    const updated = await api.updateProfile(profile.id, {
      preferences: filters,
    });
    setProfile(updated);
    setNotice("Default search updated");
  }

  const title =
    view === "discover"
      ? "Recommended roles"
      : view === "saved"
        ? "Saved roles"
        : "Applications";
  const activeFilters = useMemo(
    () =>
      filters.employment_types.length +
      filters.seniority.length +
      Number(Boolean(filters.minimum_salary)),
    [filters],
  );

  return (
    <main className="flex h-dvh min-h-[680px] flex-col overflow-hidden bg-[#f7f8fb] text-[#101936]">
      <Header
        view={view}
        setView={changeView}
        profiles={profiles}
        profile={profile}
        setProfile={(next) => {
          setProfile(next);
          localStorage.setItem("job-scout-profile", next.id);
          setFilters({ ...defaultFilters, ...next.preferences });
        }}
      />
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[272px] shrink-0 overflow-y-auto border-r bg-white px-5 py-6 lg:block">
          <FiltersPanel
            filters={filters}
            setFilters={setFilters}
            onSearch={runSearch}
            onSaveDefaults={saveDefaults}
          />
        </aside>

        <section className="flex min-w-0 flex-1 flex-col border-r bg-[#fafbfc] xl:max-w-[540px]">
          <div className="border-b bg-white px-4 py-4 lg:hidden">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#66708d]" />
                <Input
                  aria-label="Search keywords"
                  className="h-11 rounded-xl pl-9"
                  value={filters.query}
                  onChange={(event) =>
                    setFilters({ ...filters, query: event.target.value })
                  }
                  onKeyDown={(event) =>
                    event.key === "Enter" && void runSearch()
                  }
                />
              </div>
              <Sheet>
                <SheetTrigger
                  render={
                    <Button
                      variant="outline"
                      size="icon-lg"
                      className="relative h-11 w-11 rounded-xl"
                      aria-label="Open filters"
                    />
                  }
                >
                  <Filter />
                  <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#3d49df] text-[10px] text-white">
                    {activeFilters}
                  </span>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="w-[330px] overflow-y-auto p-5"
                >
                  <SheetHeader>
                    <SheetTitle>Search filters</SheetTitle>
                    <SheetDescription>
                      Shape the roles in this search.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="mt-5">
                    <FiltersPanel
                      filters={filters}
                      setFilters={setFilters}
                      onSearch={runSearch}
                      onSaveDefaults={saveDefaults}
                    />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="border-b bg-white px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6f7892]">
                  Personal search
                </p>
                <h1 className="mt-1 text-[25px] font-semibold tracking-[-0.025em]">
                  {title}
                </h1>
              </div>
              <Select
                value={filters.sort}
                onValueChange={(value) =>
                  setFilters({
                    ...filters,
                    sort: value as SearchFilters["sort"],
                  })
                }
              >
                <SelectTrigger className="w-[126px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Best match</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="salary">Salary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div
              className="mt-4 flex items-center gap-2 text-sm text-[#56617d]"
              aria-live="polite"
            >
              {loading ? (
                <LoaderCircle className="size-4 animate-spin text-[#3d49df]" />
              ) : (
                <Sparkles className="size-4 text-[#3d49df]" />
              )}
              <span className="truncate">{notice}</span>
              {checked > 0 && view === "discover" && (
                <span className="ml-auto shrink-0 tabular-nums">
                  {checked.toLocaleString()} checked
                </span>
              )}
            </div>
            {view === "discover" && (
              <Progress
                value={progress * 100}
                className="mt-3 [&_[data-slot=progress-indicator]]:bg-[#3d49df]"
                aria-label="Search progress"
              />
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-3 pb-20 sm:p-4 sm:pb-4">
            {jobs.length ? (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <JobCard
                    key={`${job.provider}-${job.provider_job_id}`}
                    job={job}
                    selected={job.provider_job_id === selected.provider_job_id}
                    onSelect={() => {
                      setSelected(job);
                      if (window.innerWidth < 1280) setDetailOpen(true);
                    }}
                    onSave={() => {
                      setSelected(job);
                      void save("saved");
                    }}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                view={view}
                onDiscover={() => void changeView("discover")}
              />
            )}
          </div>
          <footer className="hidden h-12 items-center border-t bg-white px-5 text-sm text-[#6c7690] sm:flex">
            {total === null
              ? `${jobs.length} roles loaded so far`
              : `${total.toLocaleString()} matching roles`}
            {searchId && (
              <span className="ml-auto font-mono text-[10px]">
                {searchId.slice(0, 8)}
              </span>
            )}
          </footer>
        </section>

        <section className="hidden min-w-0 flex-1 bg-white xl:block">
          <JobDetail job={selected} onSave={save} onRemove={removeSelected} />
        </section>
      </div>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent
          side="bottom"
          className="h-[92dvh] overflow-y-auto rounded-t-[22px] p-0 xl:hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{selected.title}</SheetTitle>
            <SheetDescription>Job details</SheetDescription>
          </SheetHeader>
          <JobDetail job={selected} onSave={save} onRemove={removeSelected} />
        </SheetContent>
      </Sheet>
    </main>
  );
}

function Header({
  view,
  setView,
  profiles,
  profile,
  setProfile,
}: {
  view: View;
  setView: (view: View) => void;
  profiles: Profile[];
  profile: Profile | null;
  setProfile: (profile: Profile) => void;
}) {
  return (
    <header className="flex h-[68px] shrink-0 items-center border-b bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3 lg:w-[246px]">
        <div className="grid size-9 rotate-3 place-items-center rounded-xl bg-[#172158] text-white shadow-sm">
          <Search className="size-5 -rotate-3" />
        </div>
        <span className="text-lg font-bold tracking-[-0.02em]">Job Scout</span>
      </div>
      <nav
        className="mx-auto hidden h-full items-center gap-8 sm:flex"
        aria-label="Main navigation"
      >
        {(["discover", "saved", "applied"] as const).map((item) => (
          <button
            key={item}
            className={cn(
              "relative flex h-full items-center gap-2 capitalize text-[#525d78] transition-colors hover:text-[#16204a]",
              view === item &&
                "font-semibold text-[#303bd2] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#3d49df]",
            )}
            onClick={() => void setView(item)}
          >
            {item === "discover" ? (
              <Search className="size-4" />
            ) : item === "saved" ? (
              <Bookmark className="size-4" />
            ) : (
              <BriefcaseBusiness className="size-4" />
            )}
            {item}
          </button>
        ))}
      </nav>
      <div className="ml-auto">
        <Select
          value={profile?.id ?? "offline"}
          onValueChange={(value) => {
            const next = profiles.find((item) => item.id === value);
            if (next) setProfile(next);
          }}
        >
          <SelectTrigger className="h-10 min-w-[108px] rounded-xl border-[#dfe2eb] bg-[#fafbfc]">
            <Avatar className="size-6">
              <AvatarFallback className="bg-[#ececff] text-xs font-bold text-[#3d49df]">
                {profile?.display_name?.[0] ?? "G"}
              </AvatarFallback>
            </Avatar>
            <SelectValue>{profile?.display_name ?? "Gui"}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {profiles.map((item) => (
              <SelectItem key={item.id} value={item.id}>
                {item.display_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex h-[66px] items-center justify-around border-t bg-white/95 px-5 backdrop-blur sm:hidden"
        aria-label="Mobile navigation"
      >
        {(["discover", "saved", "applied"] as const).map((item) => (
          <button
            key={item}
            onClick={() => void setView(item)}
            className={cn(
              "flex flex-col items-center gap-1 text-[11px] capitalize text-[#67718a]",
              view === item && "font-semibold text-[#3d49df]",
            )}
          >
            {item === "discover" ? (
              <Search />
            ) : item === "saved" ? (
              <Bookmark />
            ) : (
              <BriefcaseBusiness />
            )}
            {item}
          </button>
        ))}
        <button className="flex flex-col items-center gap-1 text-[11px] text-[#67718a]">
          <UserRound />
          Profile
        </button>
      </nav>
    </header>
  );
}

function FiltersPanel({
  filters,
  setFilters,
  onSearch,
  onSaveDefaults,
}: {
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  onSearch: () => void;
  onSaveDefaults: () => void;
}) {
  const toggle = (field: "employment_types" | "seniority", value: string) => {
    const values = filters[field];
    setFilters({
      ...filters,
      [field]: values.includes(value)
        ? values.filter((item) => item !== value)
        : [...values, value],
    });
  };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Filters</h2>
        <Button
          variant="link"
          className="h-auto p-0 text-[#3d49df]"
          onClick={() => setFilters(defaultFilters)}
        >
          Reset
        </Button>
      </div>
      <label className="block space-y-2">
        <span className="text-sm font-semibold">Keywords</span>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#727b92]" />
          <Input
            value={filters.query}
            onChange={(event) =>
              setFilters({ ...filters, query: event.target.value })
            }
            onKeyDown={(event) => event.key === "Enter" && onSearch()}
            className="h-10 rounded-xl pl-9"
          />
        </div>
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-semibold">Location</span>
        <Select
          value={filters.worldwide ? "worldwide" : (filters.country ?? "any")}
          onValueChange={(value) =>
            setFilters({
              ...filters,
              worldwide: value === "worldwide" ? true : null,
              country: value === "worldwide" || value === "any" ? null : value,
            })
          }
        >
          <SelectTrigger className="h-10 w-full rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="worldwide">Worldwide</SelectItem>
            <SelectItem value="Brazil">Brazil</SelectItem>
            <SelectItem value="United States">United States</SelectItem>
            <SelectItem value="any">Any location</SelectItem>
          </SelectContent>
        </Select>
      </label>
      <FilterGroup
        title="Employment type"
        values={["Full Time", "Contractor", "Part Time", "Intern"]}
        selected={filters.employment_types}
        onToggle={(value) => toggle("employment_types", value)}
      />
      <FilterGroup
        title="Seniority"
        values={["Senior", "Manager", "Executive"]}
        selected={filters.seniority}
        onToggle={(value) => toggle("seniority", value)}
      />
      <label className="block space-y-2">
        <span className="text-sm font-semibold">Minimum salary (USD)</span>
        <Select
          value={String(filters.minimum_salary ?? 0)}
          onValueChange={(value) =>
            setFilters({ ...filters, minimum_salary: Number(value) || null })
          }
        >
          <SelectTrigger className="h-10 w-full rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Any salary</SelectItem>
            <SelectItem value="100000">$100,000</SelectItem>
            <SelectItem value="150000">$150,000</SelectItem>
            <SelectItem value="200000">$200,000</SelectItem>
          </SelectContent>
        </Select>
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-semibold">Posted within</span>
        <Select
          value={String(filters.posted_within_days ?? 0)}
          onValueChange={(value) =>
            setFilters({
              ...filters,
              posted_within_days: Number(value) || null,
            })
          }
        >
          <SelectTrigger className="h-10 w-full rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Any time</SelectItem>
            <SelectItem value="1">Last 24 hours</SelectItem>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
      </label>
      <Button
        className="h-10 w-full rounded-xl bg-[#3d49df] hover:bg-[#303ac2]"
        onClick={onSearch}
      >
        <SlidersHorizontal />
        Search these roles
      </Button>
      <Button
        variant="outline"
        className="h-10 w-full rounded-xl"
        onClick={onSaveDefaults}
      >
        <BookmarkCheck />
        Save as default
      </Button>
      <p className="text-xs leading-5 text-[#7a849c]">
        Defaults belong only to the selected profile.
      </p>
    </div>
  );
}

function FilterGroup({
  title,
  values,
  selected,
  onToggle,
}: {
  title: string;
  values: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-semibold">{title}</legend>
      {values.map((value) => (
        <label
          key={value}
          className="flex cursor-pointer items-center gap-2.5 text-sm text-[#4e5872]"
        >
          <Checkbox
            checked={selected.includes(value)}
            onCheckedChange={() => onToggle(value)}
          />
          <span>{value}</span>
        </label>
      ))}
    </fieldset>
  );
}

function JobCard({
  job,
  selected,
  onSelect,
  onSave,
}: {
  job: Job;
  selected: boolean;
  onSelect: () => void;
  onSave: () => void;
}) {
  return (
    <article
      className={cn(
        "group relative cursor-pointer rounded-[14px] border bg-white p-4 shadow-[0_3px_14px_rgba(16,25,54,0.04)] transition hover:-translate-y-0.5 hover:border-[#aeb3f5] hover:shadow-[0_8px_24px_rgba(16,25,54,0.08)] motion-reduce:transform-none",
        selected && "border-[#5964ed] bg-[#fbfbff] ring-1 ring-[#5964ed]",
      )}
      onClick={onSelect}
      tabIndex={0}
      onKeyDown={(event) =>
        (event.key === "Enter" || event.key === " ") && onSelect()
      }
    >
      <div className="flex gap-3.5">
        <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-[#111936] text-lg font-bold text-white">
          {job.company.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-[#5f6982]">{job.company}</p>
          <h3 className="mt-0.5 truncate pr-7 text-[17px] font-semibold tracking-[-0.015em]">
            {job.title}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#5d6780]">
            <span className="flex items-center gap-1">
              <Globe2 className="size-3.5" />
              {job.location_text ?? "Remote"}
            </span>
            <span className="font-medium text-[#303954]">{money(job)}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge variant="secondary">
              {job.employment_type.replaceAll("_", " ")}
            </Badge>
            {job.seniority && (
              <Badge variant="outline" className="text-[#403fc5]">
                {job.seniority}
              </Badge>
            )}
            <span className="ml-auto text-xs text-[#838ca1]">
              {age(job.posted_at)}
            </span>
          </div>
        </div>
        <button
          aria-label={`Save ${job.title} at ${job.company}`}
          className="absolute right-3 top-3 rounded-lg p-2 text-[#5e6780] hover:bg-[#eff0ff] hover:text-[#3d49df]"
          onClick={(event) => {
            event.stopPropagation();
            onSave();
          }}
        >
          {job.state ? (
            <BookmarkCheck className="size-5 text-[#3d49df]" />
          ) : (
            <Bookmark className="size-5" />
          )}
        </button>
      </div>
    </article>
  );
}

function JobDetail({
  job,
  onSave,
  onRemove,
}: {
  job: Job;
  onSave: (state: "saved" | "applied") => void;
  onRemove: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-full max-w-[760px] flex-col px-5 pb-24 pt-7 sm:px-8 sm:pb-8 lg:px-10">
      <div className="flex items-start gap-4">
        <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-[#111936] text-xl font-bold text-white">
          {job.company.slice(0, 1)}
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl font-semibold tracking-[-0.025em] sm:text-[30px]">
            {job.title}
          </h2>
          <p className="mt-1 flex items-center gap-2 font-semibold">
            {job.company}
            <a
              href={job.job_url}
              target="_blank"
              rel="noreferrer"
              aria-label="Open source listing"
              className="text-[#3d49df]"
            >
              <ExternalLink className="size-4" />
            </a>
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[#5f6982]">
        <span className="flex items-center gap-1.5">
          <Globe2 className="size-4" />
          {job.location_text ?? "Remote"}
        </span>
        <span className="flex items-center gap-1.5">
          <BriefcaseBusiness className="size-4" />
          {job.employment_type.replaceAll("_", " ")}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge className="border-0 bg-[#e9f7ec] px-3 py-1 text-[#236c39]">
          {money(job)} {job.salary_currency ?? ""}
        </Badge>
        {job.seniority && (
          <Badge variant="secondary" className="px-3 py-1">
            {job.seniority}
          </Badge>
        )}
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 border-y py-5">
        <Button
          variant="outline"
          className="h-11 rounded-xl"
          onClick={() => onSave("saved")}
        >
          <Bookmark />
          {job.state === "saved" ? "Saved" : "Save"}
        </Button>
        <Button
          className="h-11 rounded-xl bg-[#f26450] text-white hover:bg-[#df503d]"
          onClick={() => onSave("applied")}
        >
          <CheckCircle2 />
          {job.state === "applied" ? "Applied" : "Mark as applied"}
        </Button>
      </div>
      <article className="mt-7 flex-1">
        <div className="mb-6 flex gap-7 border-b text-sm font-semibold text-[#68728a]">
          <span className="border-b-2 border-[#3d49df] pb-3 text-[#3d49df]">
            Overview
          </span>
          <span>Requirements</span>
          <span>Benefits</span>
        </div>
        <div className="whitespace-pre-line text-[15px] leading-7 text-[#3d4660]">
          {job.description ||
            "Open the source listing to read the full role description."}
        </div>
        <h3 className="mt-7 font-semibold text-[#111936]">Role details</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <Badge variant="outline">Remote</Badge>
          <Badge variant="outline">
            {job.employment_type.replaceAll("_", " ")}
          </Badge>
          {job.seniority && <Badge variant="outline">{job.seniority}</Badge>}
        </div>
      </article>
      <footer className="mt-10 flex items-center border-t pt-5 text-sm text-[#768098]">
        <span>
          From{" "}
          <a
            href="https://himalayas.app"
            className="font-semibold text-[#3d49df]"
            target="_blank"
            rel="noreferrer"
          >
            Himalayas
          </a>
        </span>
        {job.id && (
          <Button
            variant="ghost"
            className="ml-auto text-[#b34438]"
            onClick={onRemove}
          >
            <Trash2 />
            Remove permanently
          </Button>
        )}
      </footer>
    </div>
  );
}

function EmptyState({
  view,
  onDiscover,
}: {
  view: View;
  onDiscover: () => void;
}) {
  return (
    <div className="mx-auto flex max-w-sm flex-col items-center px-6 py-20 text-center">
      <div className="grid size-12 place-items-center rounded-2xl bg-[#eeeefe] text-[#3d49df]">
        {view === "applied" ? <BriefcaseBusiness /> : <Bookmark />}
      </div>
      <h2 className="mt-4 text-lg font-semibold">No {view} roles yet</h2>
      <p className="mt-2 text-sm leading-6 text-[#6d7690]">
        Your profile keeps its own private library. Discover a role and add it
        when it feels worth returning to.
      </p>
      <Button className="mt-5 bg-[#3d49df]" onClick={onDiscover}>
        Discover roles
      </Button>
    </div>
  );
}
