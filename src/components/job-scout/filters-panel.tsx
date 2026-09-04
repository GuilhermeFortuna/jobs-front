"use client";

import { BookmarkCheck, SlidersHorizontal } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupInput,
} from "@/components/ui/input-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import type { ProviderDescriptor, SearchFilters } from "@/lib/api";
import { DEFAULT_FILTERS } from "@/hooks/use-job-scout";
import { hasSearchCriteria } from "@/lib/search-params";
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

const EMPLOYMENT_TYPES = ["Full Time", "Contractor", "Part Time", "Intern"];
const SENIORITY_LEVELS = ["Senior", "Manager", "Executive"];
const SALARY_STEPS = [0, 100_000, 150_000, 200_000] as const;

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

function salaryIndex(minimumSalary: number | null | undefined): number {
  const value = minimumSalary ?? 0;
  const exact = SALARY_STEPS.indexOf(value as (typeof SALARY_STEPS)[number]);
  if (exact >= 0) return exact;
  let nearest = 0;
  for (let i = 0; i < SALARY_STEPS.length; i += 1) {
    if (
      Math.abs(SALARY_STEPS[i] - value) <
      Math.abs(SALARY_STEPS[nearest] - value)
    ) {
      nearest = i;
    }
  }
  return nearest;
}

function salaryLabel(minimumSalary: number | null | undefined): string {
  const value = minimumSalary ?? 0;
  if (!value) return "Any salary";
  return `$${value.toLocaleString("en-US")}`;
}

type CheckboxGroupOption = {
  value: string;
  label: string;
  unavailable?: boolean;
};

/** One checkbox-group implementation; unavailable is a state, not a second copy. */
function CheckboxGroup({
  title,
  options,
  selected,
  onToggle,
  disabled,
  description,
}: {
  title: string;
  options: CheckboxGroupOption[];
  selected: string[];
  onToggle: (value: string) => void;
  disabled?: boolean;
  description?: string;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-semibold">{title}</legend>
      {options.map(({ value, label, unavailable }) => (
        <label
          key={value}
          className={cn(
            "flex items-center gap-2.5 text-sm text-foreground/80",
            unavailable || disabled
              ? "cursor-not-allowed opacity-60"
              : "cursor-pointer",
          )}
        >
          <Checkbox
            checked={!unavailable && selected.includes(value)}
            disabled={unavailable || disabled}
            onCheckedChange={() => {
              if (unavailable) return;
              onToggle(value);
            }}
          />
          <span className="break-words">
            {label}
            {unavailable ? " · Unavailable" : ""}
          </span>
        </label>
      ))}
      {description ? (
        <p className="text-xs leading-5 text-muted-foreground">{description}</p>
      ) : null}
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
  const canSearch = hasSearchCriteria(filters);
  const toggleList = (
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

  const providerCheckboxOptions: CheckboxGroupOption[] = providerOptions(
    providers,
  ).map(({ key, display_name, state }) => ({
    value: key,
    label: display_name,
    unavailable: state !== "enabled",
  }));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Filters</h2>
        <Button
          variant="link"
          className="h-auto p-0 text-primary-emphasis dark:text-primary"
          onClick={() => setFilters(DEFAULT_FILTERS)}
          disabled={disabled}
        >
          Reset
        </Button>
      </div>

      <Accordion
        multiple
        defaultValue={["basics", "role", "providers", "compensation"]}
        className="w-full"
      >
        <AccordionItem value="basics">
          <AccordionTrigger>Location & eligibility</AccordionTrigger>
          <AccordionContent>
            <FieldGroup>
              <Field>
                <FieldLabel>Role location</FieldLabel>
                <InputGroup className="h-10 rounded-xl">
                  <InputGroupInput
                    aria-label="Role location"
                    value={filters.location}
                    onChange={(event) =>
                      setFilters({ ...filters, location: event.target.value })
                    }
                    onKeyDown={(event) => event.key === "Enter" && onSearch()}
                    placeholder="e.g. Lisbon, Remote Europe"
                    disabled={disabled}
                  />
                </InputGroup>
                <FieldDescription className="text-xs leading-5">
                  Filters where the role is based. Distinct from eligibility
                  below.
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel>Eligible countries</FieldLabel>
                <Select
                  value={
                    filters.worldwide ? "worldwide" : (filters.country ?? "any")
                  }
                  onValueChange={(value) =>
                    setFilters({
                      ...filters,
                      worldwide: value === "worldwide" ? true : null,
                      country:
                        value === "worldwide" || value === "any" ? null : value,
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
                <FieldDescription className="text-xs leading-5">
                  Where a candidate may apply, not the role&apos;s office
                  location.
                </FieldDescription>
              </Field>
            </FieldGroup>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="role">
          <AccordionTrigger>Employment & seniority</AccordionTrigger>
          <AccordionContent>
            <div className="flex flex-col gap-4">
              <Field>
                <FieldLabel>Employment type</FieldLabel>
                <ToggleGroup
                  multiple
                  variant="outline"
                  size="sm"
                  spacing={1}
                  orientation="vertical"
                  className="w-full"
                  value={filters.employment_types}
                  disabled={disabled}
                  onValueChange={(next) =>
                    setFilters({ ...filters, employment_types: next })
                  }
                  aria-label="Employment type"
                >
                  {EMPLOYMENT_TYPES.map((value) => (
                    <ToggleGroupItem
                      key={value}
                      value={value}
                      className="w-full justify-start"
                    >
                      {value}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>
              <Field>
                <FieldLabel>Seniority</FieldLabel>
                <ToggleGroup
                  multiple
                  variant="outline"
                  size="sm"
                  spacing={1}
                  orientation="vertical"
                  className="w-full"
                  value={filters.seniority}
                  disabled={disabled}
                  onValueChange={(next) =>
                    setFilters({ ...filters, seniority: next })
                  }
                  aria-label="Seniority"
                >
                  {SENIORITY_LEVELS.map((value) => (
                    <ToggleGroupItem
                      key={value}
                      value={value}
                      className="w-full justify-start"
                    >
                      {value}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </Field>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="providers">
          <AccordionTrigger>Providers</AccordionTrigger>
          <AccordionContent>
            <CheckboxGroup
              title="Providers"
              options={providerCheckboxOptions}
              selected={filters.providers}
              onToggle={(value) => toggleList("providers", value)}
              disabled={disabled}
              description="Leave all unchecked to search every enabled provider."
            />
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="compensation">
          <AccordionTrigger>Salary & freshness</AccordionTrigger>
          <AccordionContent>
            <FieldGroup>
              <Field>
                <FieldLabel>Minimum salary (USD)</FieldLabel>
                <div className="flex flex-col gap-2 pt-1">
                  <Slider
                    min={0}
                    max={SALARY_STEPS.length - 1}
                    step={1}
                    value={[salaryIndex(filters.minimum_salary)]}
                    disabled={disabled}
                    aria-label="Minimum salary"
                    onValueChange={(next) => {
                      const index = Array.isArray(next) ? next[0] : next;
                      const stepped = SALARY_STEPS[index] ?? 0;
                      setFilters({
                        ...filters,
                        minimum_salary: stepped || null,
                      });
                    }}
                  />
                  <FieldDescription className="text-xs leading-5">
                    {salaryLabel(filters.minimum_salary)}
                  </FieldDescription>
                </div>
              </Field>
              <Field>
                <FieldLabel>Posted within</FieldLabel>
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
              </Field>
            </FieldGroup>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <Button
        className="h-10 w-full rounded-xl bg-primary hover:bg-primary-hover"
        onClick={onSearch}
        disabled={disabled || !canSearch}
        aria-describedby={!canSearch ? "search-criteria-help" : undefined}
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
      <p
        id="search-criteria-help"
        className="text-xs leading-5 text-muted-foreground"
      >
        Add keywords, a location, eligibility, seniority, employment type, a
        salary floor, or posting age to search.
      </p>
    </div>
  );
}
