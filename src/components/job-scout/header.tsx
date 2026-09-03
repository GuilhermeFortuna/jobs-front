"use client";

import { Bookmark, BriefcaseBusiness, Search, UserRound } from "lucide-react";

import { HeaderAmbient } from "@/components/job-scout/header-ambient";
import { ProfilePicker } from "@/components/job-scout/profile-picker";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Profile } from "@/lib/api";
import type { View } from "@/hooks/use-job-scout";
import { cn } from "@/lib/utils";

type HeaderProps = {
  view: View;
  setView: (view: View) => void;
  profiles: Profile[];
  profile: Profile | null;
  setProfile: (profile: Profile) => void;
  onCreateProfile: (name: string) => Promise<Profile | undefined>;
  onRenameProfile: (name: string) => Promise<Profile | undefined>;
  onUpdateSkills: (labels: string[]) => Promise<Profile | undefined>;
  profileFallbackNotice?: string | null;
  mobileProfileOpen: boolean;
  setMobileProfileOpen: (open: boolean) => void;
  skillsOpen?: boolean;
  onSkillsOpenChange?: (open: boolean) => void;
};

const VIEWS = [
  { id: "discover" as const, icon: Search },
  { id: "saved" as const, icon: Bookmark },
  { id: "applied" as const, icon: BriefcaseBusiness },
];

function ViewTabs({
  view,
  setView,
  layout,
}: {
  view: View;
  setView: (view: View) => void;
  layout: "desktop" | "mobile";
}) {
  return (
    <Tabs
      value={view}
      onValueChange={(value) => void setView(value as View)}
      className={cn(
        "gap-0",
        layout === "mobile" ? "h-[66px] w-full" : "h-full w-auto",
      )}
    >
      <TabsList
        variant="line"
        activateOnFocus
        className={cn(
          "rounded-none bg-transparent p-0",
          layout === "mobile"
            ? "h-[66px] w-full justify-around gap-0"
            : "h-full w-auto justify-center gap-8",
        )}
      >
        {VIEWS.map(({ id, icon: Icon }) => (
          <TabsTrigger
            key={id}
            value={id}
            className={cn(
              "h-full rounded-none px-1 capitalize text-muted-foreground shadow-none data-active:font-semibold data-active:text-primary",
              layout === "mobile"
                ? "flex-1 flex-col gap-1 text-[11px] after:hidden"
                : "flex-none flex-row gap-2 text-sm after:block after:bg-primary",
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {id}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

export function Header({
  view,
  setView,
  profiles,
  profile,
  setProfile,
  onCreateProfile,
  onRenameProfile,
  onUpdateSkills,
  profileFallbackNotice,
  mobileProfileOpen,
  setMobileProfileOpen,
  skillsOpen,
  onSkillsOpenChange,
}: HeaderProps) {
  return (
    <>
      <header className="relative flex h-[68px] shrink-0 items-center gap-3 border-b bg-card/95 px-4 shadow-sm backdrop-blur-sm sm:px-6">
        <HeaderAmbient />

        <div className="relative z-10 flex shrink-0 items-center gap-3 lg:w-[246px]">
          <div className="grid size-9 place-items-center rounded-xl bg-brand-mark text-primary-foreground shadow-sm">
            <Search className="size-5" aria-hidden="true" />
          </div>
          <span className="font-display text-lg font-bold tracking-[-0.02em]">
            Job Scout
          </span>
        </div>

        <nav
          aria-label="Main navigation"
          className="relative z-10 hidden h-full min-w-0 flex-1 items-center justify-center sm:flex"
        >
          <ViewTabs view={view} setView={setView} layout="desktop" />
        </nav>

        <div className="relative z-10 ml-auto flex shrink-0 items-center gap-2">
          <ThemeToggle />
          <ProfilePicker
            profiles={profiles}
            profile={profile}
            onSelect={setProfile}
            onCreate={onCreateProfile}
            onRename={onRenameProfile}
            onUpdateSkills={onUpdateSkills}
            fallbackNotice={profileFallbackNotice}
            mobileOpen={mobileProfileOpen}
            onMobileOpenChange={setMobileProfileOpen}
            skillsOpen={skillsOpen}
            onSkillsOpenChange={onSkillsOpenChange}
          />
        </div>
      </header>

      <div className="fixed inset-x-0 bottom-0 z-30 flex h-[calc(66px+env(safe-area-inset-bottom,0px))] items-end bg-card/95 px-2 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur sm:hidden">
        <Separator className="absolute inset-x-0 top-0" />
        <nav
          aria-label="Main navigation"
          className="flex h-[66px] min-w-0 flex-1 items-center"
        >
          <ViewTabs view={view} setView={setView} layout="mobile" />
        </nav>
        <button
          type="button"
          className="flex h-[66px] w-16 shrink-0 flex-col items-center justify-center gap-1 text-[11px] text-muted-foreground focus-ring"
          onClick={() => setMobileProfileOpen(true)}
          aria-label="Open profile settings"
        >
          <UserRound aria-hidden="true" />
          Profile
        </button>
      </div>
    </>
  );
}
