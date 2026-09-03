"use client";

import { BookmarkCheck, Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProviderDescriptor, SearchFilters } from "@/lib/api";
import { DEFAULT_FILTERS } from "@/hooks/use-job-scout";
import { formatProviderName, KNOWN_PROVIDER_KEYS } from "@/lib/providers";
import { cn } from "@/lib/utils";

type FiltersPanelProps = {
  filters: SearchFilters;
  setFilters: (filters: SearchFilters) => void;
  onSearch: () => void;
  onSaveDefaults: () => void;
  disabled?: boolean;
  /** Known providers from the API. Undefined while loading. */
  providers?: ProviderDescriptor[];
};

/** Never leave the provider filter empty if the API is slow or unreachable. */
function providerOptions(
  providers: ProviderDescriptor[] | undefined,
): ProviderDescriptor[] {
  if (providers && providers.length > 0) return providers;
  return KNOWN_PROVIDER_KEYS.map((key) => ({
    key,
    display_name: formatProviderName(key),
    state: "enabled" as const,
  }));
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
          className="flex cursor-pointer items-center gap-2.5 text-sm text-foreground/80"
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

export function FiltersPanel({
  filters,
  setFilters,
  onSearch,
  onSaveDefaults,
  disabled,
  providers,
}: FiltersPanelProps) {
  const toggle = (
    field: "employment_types" | "seniority" | "providers",
    value: string,
  ) => {
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
          className="h-auto p-0 text-primary"
          onClick={() => setFilters(DEFAULT_FILTERS)}
          disabled={disabled}
        >
          Reset
        </Button>
      </div>
      <label className="block space-y-2">
        <span className="text-sm font-semibold">Keywords</span>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search keywords"
            value={filters.query}
            onChange={(event) =>
              setFilters({ ...filters, query: event.target.value })
            }
            onKeyDown={(event) => event.key === "Enter" && onSearch()}
            className="h-10 rounded-xl pl-9"
            disabled={disabled}
          />
        </div>
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-semibold">Role location</span>
        <Input
          aria-label="Role location"
          value={filters.location}
          onChange={(event) =>
            setFilters({ ...filters, location: event.target.value })
          }
          onKeyDown={(event) => event.key === "Enter" && onSearch()}
          placeholder="e.g. Lisbon, Remote Europe"
          className="h-10 rounded-xl"
          disabled={disabled}
        />
        <span className="block text-xs leading-5 text-muted-foreground">
          Filters where the role is based. Distinct from eligibility below.
        </span>
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-semibold">Eligible countries</span>
        <Select
          value={filters.worldwide ? "worldwide" : (filters.country ?? "any")}
          onValueChange={(value) =>
            setFilters({
              ...filters,
              worldwide: value === "worldwide" ? true : null,
              country: value === "worldwide" || value === "any" ? null : value,
            })
          }
          disabled={disabled}
        >
          <SelectTrigger
            className="h-10 w-full rounded-xl"
            aria-label="Eligible countries"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="worldwide">Worldwide</SelectItem>
            <SelectItem value="Brazil">Brazil</SelectItem>
            <SelectItem value="United States">United States</SelectItem>
            <SelectItem value="any">Any eligibility</SelectItem>
          </SelectContent>
        </Select>
        <span className="block text-xs leading-5 text-muted-foreground">
          Where a candidate may apply, not the role&apos;s office location.
        </span>
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
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-semibold">Providers</legend>
        {providerOptions(providers).map(({ key, display_name, state }) => {
          const unavailable = state !== "enabled";
          return (
            <label
              key={key}
              className={cn(
                "flex items-center gap-2.5 text-sm text-foreground/80",
                unavailable
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer",
              )}
            >
              <Checkbox
                checked={!unavailable && filters.providers.includes(key)}
                disabled={unavailable || disabled}
                onCheckedChange={() => {
                  if (unavailable) return;
                  toggle("providers", key);
                }}
              />
              <span className="break-words">
                {display_name}
                {unavailable ? " · Unavailable" : ""}
              </span>
            </label>
          );
        })}
        <p className="text-xs leading-5 text-muted-foreground">
          Leave all unchecked to search every enabled provider.
        </p>
      </fieldset>
      <label className="block space-y-2">
        <span className="text-sm font-semibold">Minimum salary (USD)</span>
        <Select
          value={String(filters.minimum_salary ?? 0)}
          onValueChange={(value) =>
            setFilters({ ...filters, minimum_salary: Number(value) || null })
          }
          disabled={disabled}
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
          disabled={disabled}
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
        className="h-10 w-full rounded-xl bg-primary hover:bg-primary-hover"
        onClick={onSearch}
        disabled={disabled}
      >
        <SlidersHorizontal />
        Search these roles
      </Button>
      <Button
        variant="outline"
        className="h-10 w-full rounded-xl"
        onClick={onSaveDefaults}
        disabled={disabled}
      >
        <BookmarkCheck />
        Save as default
      </Button>
      <p className="text-xs leading-5 text-muted-foreground">
        Defaults belong only to the selected profile.
      </p>
    </div>
  );
}
