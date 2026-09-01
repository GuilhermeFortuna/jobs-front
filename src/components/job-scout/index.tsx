"use client";

import { Filter, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { DeleteJobDialog } from "@/components/job-scout/delete-job-dialog";
import { FiltersPanel } from "@/components/job-scout/filters-panel";
import { Header } from "@/components/job-scout/header";
import { EmptyState, JobCard } from "@/components/job-scout/job-card";
import { JobDetail } from "@/components/job-scout/job-detail";
import { SearchStatus } from "@/components/job-scout/search-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useJobScout } from "@/hooks/use-job-scout";
import type { SearchFilters } from "@/lib/api";
import { countActiveFilters, jobKey } from "@/lib/job-utils";

export function JobScout() {
  const scout = useJobScout();
  const [detailOpen, setDetailOpen] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);

  const title =
    scout.view === "discover"
      ? "Recommended roles"
      : scout.view === "saved"
        ? "Saved roles"
        : "Applications";

  const activeFilters = useMemo(
    () => countActiveFilters(scout.filters),
    [scout.filters],
  );

  const selectedKey = scout.selected ? jobKey(scout.selected) : null;

  return (
    <main className="flex h-dvh min-h-[680px] flex-col overflow-hidden bg-[#f7f8fb] text-[#101936]">
      <Header
        view={scout.view}
        setView={scout.changeView}
        profiles={scout.profiles}
        profile={scout.profile}
        setProfile={scout.setProfile}
        onCreateProfile={scout.createProfile}
        onRenameProfile={scout.renameProfile}
        profileFallbackNotice={scout.profileFallbackNotice}
        mobileProfileOpen={mobileProfileOpen}
        setMobileProfileOpen={setMobileProfileOpen}
      />

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-[272px] shrink-0 overflow-y-auto border-r bg-white px-5 py-6 lg:block">
          <FiltersPanel
            filters={scout.filters}
            setFilters={scout.setFilters}
            onSearch={() => void scout.runSearch()}
            onSaveDefaults={() => void scout.saveDefaults()}
            disabled={!scout.apiOnline && scout.jobs.length === 0}
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
                  value={scout.filters.query}
                  onChange={(event) =>
                    scout.setFilters({
                      ...scout.filters,
                      query: event.target.value,
                    })
                  }
                  onKeyDown={(event) =>
                    event.key === "Enter" && void scout.runSearch()
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
                      filters={scout.filters}
                      setFilters={scout.setFilters}
                      onSearch={() => void scout.runSearch()}
                      onSaveDefaults={() => void scout.saveDefaults()}
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
              {scout.view === "discover" && (
                <Select
                  value={scout.filters.sort}
                  onValueChange={(value) =>
                    scout.setFilters({
                      ...scout.filters,
                      sort: value as SearchFilters["sort"],
                    })
                  }
                >
                  <SelectTrigger
                    className="w-[126px]"
                    aria-label="Sort results"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Best match</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="salary">Salary</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <SearchStatus
            view={scout.view}
            loading={scout.loading}
            notice={scout.notice}
            liveAnnouncement={scout.liveAnnouncement}
            checked={scout.checked}
            progress={scout.progress}
            total={scout.total}
            warnings={scout.warnings}
            providerStatuses={scout.providerStatuses}
            statusKind={scout.statusKind}
            searchExpired={scout.searchExpired}
            onRetry={() => void scout.retryConnection()}
            onRefresh={() => void scout.refreshDefaultSearch()}
            onRunSearch={() => void scout.runSearch()}
          />

          <div className="min-h-0 flex-1 overflow-y-auto p-3 pb-20 sm:p-4 sm:pb-4">
            {scout.jobs.length ? (
              <div className="space-y-3">
                {scout.jobs.map((job) => (
                  <JobCard
                    key={jobKey(job)}
                    job={job}
                    selected={jobKey(job) === selectedKey}
                    onSelect={() => {
                      scout.setSelected(job);
                      if (window.innerWidth < 1280) setDetailOpen(true);
                    }}
                    onSave={() => {
                      scout.setSelected(job);
                      void scout.saveJob("saved", job);
                    }}
                  />
                ))}
              </div>
            ) : scout.loading ? (
              <div className="mx-auto flex max-w-sm flex-col items-center px-6 py-20 text-center text-sm text-[#6d7690]">
                Loading roles…
              </div>
            ) : (
              <EmptyState
                view={scout.view}
                statusKind={scout.statusKind}
                onDiscover={() => void scout.changeView("discover")}
                onRetry={() => void scout.retryConnection()}
              />
            )}
          </div>

          <footer className="hidden h-12 items-center border-t bg-white px-5 text-sm text-[#6c7690] sm:flex">
            {scout.view === "discover" && scout.total === null
              ? `${scout.jobs.length} roles loaded so far`
              : scout.view === "discover"
                ? `${(scout.total ?? scout.jobs.length).toLocaleString()} matching roles`
                : `${scout.jobs.length} ${scout.view} roles`}
            {scout.searchId && scout.view === "discover" && (
              <span className="ml-auto font-mono text-[10px]">
                {scout.searchId.slice(0, 8)}
              </span>
            )}
          </footer>
        </section>

        <section className="hidden min-w-0 flex-1 overflow-y-auto bg-white xl:block">
          {scout.selected ? (
            <JobDetail
              job={scout.selected}
              onSave={(state) => void scout.saveJob(state)}
              onRemove={() => scout.confirmDelete(scout.selected!)}
            />
          ) : (
            <div className="grid h-full place-items-center text-sm text-[#6d7690]">
              Select a role to view details
            </div>
          )}
        </section>
      </div>

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent
          side="bottom"
          className="h-[92dvh] overflow-y-auto rounded-t-[22px] p-0 xl:hidden"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{scout.selected?.title ?? "Job details"}</SheetTitle>
            <SheetDescription>Job details</SheetDescription>
          </SheetHeader>
          {scout.selected && (
            <JobDetail
              job={scout.selected}
              onSave={(state) => void scout.saveJob(state)}
              onRemove={() => scout.confirmDelete(scout.selected!)}
            />
          )}
        </SheetContent>
      </Sheet>

      {scout.deleteTarget && (
        <DeleteJobDialog
          target={scout.deleteTarget}
          onOpenChange={(open) => {
            if (!open) scout.setDeleteTarget(null);
          }}
          onConfirm={() => void scout.deleteJob()}
        />
      )}
    </main>
  );
}
