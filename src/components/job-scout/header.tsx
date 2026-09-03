"use client";

import { Bookmark, BriefcaseBusiness, Search, UserRound } from "lucide-react";

import { ProfilePicker } from "@/components/job-scout/profile-picker";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
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
    <header className="flex h-[68px] shrink-0 items-center border-b bg-card px-4 sm:px-6">
      <div className="flex items-center gap-3 lg:w-[246px]">
        <div className="grid size-9 rotate-3 place-items-center rounded-xl bg-brand-mark text-primary-foreground shadow-sm">
          <Search className="size-5 -rotate-3" aria-hidden="true" />
        </div>
        <span className="font-display text-lg font-bold tracking-[-0.02em]">
          Job Scout
        </span>
      </div>
      <nav
        className="mx-auto hidden h-full items-center gap-8 sm:flex"
        aria-label="Main navigation"
      >
        {(["discover", "saved", "applied"] as const).map((item) => (
          <button
            key={item}
            type="button"
            className={cn(
              "relative flex h-full items-center gap-2 capitalize text-muted-foreground transition-colors hover:text-foreground focus-ring",
              view === item &&
                "font-semibold text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary",
            )}
            onClick={() => void setView(item)}
            aria-current={view === item ? "page" : undefined}
          >
            {item === "discover" ? (
              <Search className="size-4" aria-hidden="true" />
            ) : item === "saved" ? (
              <Bookmark className="size-4" aria-hidden="true" />
            ) : (
              <BriefcaseBusiness className="size-4" aria-hidden="true" />
            )}
            {item}
          </button>
        ))}
      </nav>
      <div className="ml-auto hidden items-center gap-2 sm:flex">
        <ThemeToggle />
        <ProfilePicker
          profiles={profiles}
          profile={profile}
          onSelect={setProfile}
          onCreate={onCreateProfile}
          onRename={onRenameProfile}
          onUpdateSkills={onUpdateSkills}
          fallbackNotice={profileFallbackNotice}
          skillsOpen={skillsOpen}
          onSkillsOpenChange={onSkillsOpenChange}
        />
      </div>
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex h-[66px] items-center justify-around bg-card/95 px-5 backdrop-blur sm:hidden relative"
        aria-label="Mobile navigation"
      >
        <Separator className="absolute inset-x-0 top-0" />
        {(["discover", "saved", "applied"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => void setView(item)}
            className={cn(
              "flex flex-col items-center gap-1 text-[11px] capitalize text-muted-foreground focus-ring",
              view === item && "font-semibold text-primary",
            )}
            aria-current={view === item ? "page" : undefined}
          >
            {item === "discover" ? (
              <Search aria-hidden="true" />
            ) : item === "saved" ? (
              <Bookmark aria-hidden="true" />
            ) : (
              <BriefcaseBusiness aria-hidden="true" />
            )}
            {item}
          </button>
        ))}
        <button
          type="button"
          className="flex flex-col items-center gap-1 text-[11px] text-muted-foreground focus-ring"
          onClick={() => setMobileProfileOpen(true)}
          aria-label="Open profile settings"
        >
          <UserRound aria-hidden="true" />
          Profile
        </button>
      </nav>
      <div className="flex items-center gap-1 sm:hidden">
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
  );
}
