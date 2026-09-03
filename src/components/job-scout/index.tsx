"use client";

import { Filter, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { DeleteJobDialog } from "@/components/job-scout/delete-job-dialog";
import {
  DetailEmptyState,
  EmptyState,
} from "@/components/job-scout/empty-states";
import { FiltersPanel } from "@/components/job-scout/filters-panel";
import { Header } from "@/components/job-scout/header";
import { JobCard } from "@/components/job-scout/job-card";
import { JobCardSkeleton } from "@/components/job-scout/job-card-skeleton";
import { JobDetail } from "@/components/job-scout/job-detail";
import { NoticeToaster } from "@/components/job-scout/notice-toaster";
import { ResultsPagination } from "@/components/job-scout/results-pagination";
import { SearchStatus } from "@/components/job-scout/search-status";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useJobScout } from "@/hooks/use-job-scout";
import type { SearchFilters } from "@/lib/api";
import { DETAIL_PANE_BREAKPOINT_PX } from "@/lib/breakpoints";
import { countActiveFilters, jobKey } from "@/lib/job-utils";

const SKELETON_COUNT = 5;

export function JobScout() {
  const scout = useJobScout();
  const [detailOpen, setDetailOpen] = useState(false);
  const [mobileProfileOpen, setMobileProfileOpen] = useState(false);
  const [skillsOpen, setSkillsOpen] = useState(false);

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

  const totalPages =
    scout.view === "discover" && scout.total != null && scout.total > 0
      ? Math.max(1, Math.ceil(scout.total / scout.pageSize))
      : 1;
  const showPagination =
    scout.view === "discover" &&
    scout.total != null &&
    scout.total > scout.pageSize;

  return (
    <main className="flex h-dvh min-h-[680px] flex-col overflow-hidden bg-background text-foreground">
      <NoticeToaster notice={scout.notice} />
      <Header
        view={scout.view}
        setView={(next) => {
          setDetailOpen(false);
          void scout.changeView(next);
        }}
        profiles={scout.profiles}
        profile={scout.profile}
        setProfile={scout.setProfile}
        onCreateProfile={scout.createProfile}
        onRenameProfile={scout.renameProfile}
        onUpdateSkills={scout.updateSkills}
        profileFallbackNotice={scout.profileFallbackNotice}
        mobileProfileOpen={mobileProfileOpen}
        setMobileProfileOpen={setMobileProfileOpen}
        skillsOpen={skillsOpen}
        onSkillsOpenChange={setSkillsOpen}
      />

      <div className="flex min-h-0 flex-1">
        <Card className="hidden w-[272px] shrink-0 rounded-none border-0 border-r bg-background py-0 shadow-none ring-0 lg:flex lg:flex-col">
          <ScrollArea className="h-full">
            <div className="px-5 py-6">
              <FiltersPanel
                providers={scout.providers}
                filters={scout.filters}
                setFilters={scout.setFilters}
                onSearch={() => void scout.runSearch()}
                onSaveDefaults={() => void scout.saveDefaults()}
                disabled={!scout.apiOnline && scout.jobs.length === 0}
              />
            </div>
          </ScrollArea>
        </Card>

        <Card className="flex min-w-0 flex-1 flex-col rounded-none border-0 border-r bg-background py-0 shadow-card ring-0 xl:max-w-[540px]">
          <div className="border-b bg-surface px-4 py-4 lg:hidden">
            <div className="flex gap-2">
              <InputGroup className="h-11 flex-1 rounded-xl">
                <InputGroupAddon>
                  <Search aria-hidden="true" />
                </InputGroupAddon>
                <InputGroupInput
                  aria-label="Search keywords"
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
              </InputGroup>
              <Sheet>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <SheetTrigger
                        render={
                          <Button
                            variant="outline"
                            size="icon-lg"
                            className="relative h-11 w-11 rounded-xl"
                            aria-label="Open filters"
                          >
                            <Filter />
                            <span className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">
                              {activeFilters}
                            </span>
                          </Button>
                        }
                      />
                    }
                  />
                  <TooltipContent>Open filters</TooltipContent>
                </Tooltip>
                <SheetContent side="left" className="w-[330px] p-0">
                  <ScrollArea className="h-full">
                    <div className="p-5">
                      <SheetHeader>
                        <SheetTitle>Search filters</SheetTitle>
                        <SheetDescription>
                          Shape the roles in this search.
                        </SheetDescription>
                      </SheetHeader>
                      <div className="mt-5">
                        <FiltersPanel
                          providers={scout.providers}
                          filters={scout.filters}
                          setFilters={scout.setFilters}
                          onSearch={() => void scout.runSearch()}
                          onSaveDefaults={() => void scout.saveDefaults()}
                        />
                      </div>
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="border-b bg-surface px-5 py-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
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
            {scout.view === "discover" &&
              scout.filters.sort === "relevance" && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Ordered by how well each role matches your{" "}
                  <button
                    type="button"
                    className="font-semibold text-primary-emphasis underline-offset-2 hover:underline focus-ring dark:text-primary"
                    onClick={() => setSkillsOpen(true)}
                  >
                    profile skills
                  </button>
                  .
                </p>
              )}
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

          <ScrollArea className="min-h-0 flex-1">
            <div className="p-3 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] sm:p-4 sm:pb-4">
              {scout.jobs.length ? (
                <div className="flex flex-col gap-3">
                  {scout.jobs.map((job) => (
                    <JobCard
                      key={jobKey(job)}
                      job={job}
                      selected={jobKey(job) === selectedKey}
                      onSelect={() => {
                        scout.setSelected(job);
                        if (window.innerWidth < DETAIL_PANE_BREAKPOINT_PX)
                          setDetailOpen(true);
                      }}
                      onSave={() => {
                        scout.setSelected(job);
                        void scout.saveJob("saved", job);
                      }}
                    />
                  ))}
                </div>
              ) : scout.loading ? (
                <div
                  className="flex flex-col gap-3"
                  data-testid="results-skeletons"
                >
                  {Array.from({ length: SKELETON_COUNT }, (_, index) => (
                    <JobCardSkeleton key={index} />
                  ))}
                  <span className="sr-only">Loading roles…</span>
                </div>
              ) : (
                <EmptyState
                  view={scout.view}
                  statusKind={scout.statusKind}
                  onDiscover={() => void scout.changeView("discover")}
                  onRetry={() => void scout.retryConnection()}
                />
              )}

              {/*
                The results footer is desktop-only, so mobile gets its own
                mount at the end of the list — otherwise pages beyond the
                first are unreachable below 640px.
              */}
              {showPagination && (
                <ResultsPagination
                  page={scout.page}
                  totalPages={totalPages}
                  onPageChange={(next) => void scout.setPage(next)}
                  className="mt-4 justify-center sm:hidden"
                />
              )}
            </div>
          </ScrollArea>

          <footer className="relative hidden min-h-12 flex-col justify-center gap-2 bg-background px-5 py-2 text-sm text-muted-foreground sm:flex">
            <Separator className="absolute inset-x-0 top-0" />
            <div className="flex items-center">
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
            </div>
            {showPagination && (
              <ResultsPagination
                page={scout.page}
                totalPages={totalPages}
                onPageChange={(next) => void scout.setPage(next)}
              />
            )}
          </footer>
        </Card>

        <Card className="hidden min-w-0 flex-1 rounded-none border-0 bg-background py-0 shadow-none ring-0 xl:flex xl:flex-col">
          <ScrollArea className="h-full">
            {scout.selected ? (
              <JobDetail
                job={scout.selected}
                onSave={(state) => void scout.saveJob(state)}
                onRemove={() => scout.confirmDelete(scout.selected!)}
              />
            ) : (
              <DetailEmptyState />
            )}
          </ScrollArea>
        </Card>
      </div>

      <Sheet
        open={detailOpen && scout.selected !== null}
        onOpenChange={setDetailOpen}
      >
        <SheetContent
          side="bottom"
          className="h-[92dvh] rounded-t-[22px] p-0 xl:hidden"
        >
          <ScrollArea className="h-full">
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
          </ScrollArea>
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
