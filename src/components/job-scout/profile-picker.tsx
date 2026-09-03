"use client";

import { useState } from "react";
import { Pencil, Plus, UserRound, X } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Profile } from "@/lib/api";
import { ApiError } from "@/lib/api-error";
import { validateSkillLabel } from "@/lib/skills";

type ProfilePickerProps = {
  profiles: Profile[];
  profile: Profile | null;
  onSelect: (profile: Profile) => void;
  onCreate: (name: string) => Promise<Profile | undefined>;
  onRename: (name: string) => Promise<Profile | undefined>;
  onUpdateSkills: (labels: string[]) => Promise<Profile | undefined>;
  fallbackNotice?: string | null;
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
  skillsOpen?: boolean;
  onSkillsOpenChange?: (open: boolean) => void;
};

export function ProfilePicker({
  profiles,
  profile,
  onSelect,
  onCreate,
  onRename,
  onUpdateSkills,
  fallbackNotice,
  mobileOpen,
  onMobileOpenChange,
  skillsOpen,
  onSkillsOpenChange,
}: ProfilePickerProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [renameOpen, setRenameOpen] = useState(false);
  const [internalSkillsOpen, setInternalSkillsOpen] = useState(false);
  const [name, setName] = useState("");
  const [draftLabels, setDraftLabels] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [savingSkills, setSavingSkills] = useState(false);
  const [skillsWasOpen, setSkillsWasOpen] = useState(false);

  const skillsDialogOpen = skillsOpen ?? internalSkillsOpen;

  if (skillsDialogOpen !== skillsWasOpen) {
    setSkillsWasOpen(skillsDialogOpen);
    if (skillsDialogOpen) {
      setDraftLabels(profile?.skills?.map((skill) => skill.label) ?? []);
      setSkillInput("");
      setError(null);
    }
  }

  function openSkillsDialog() {
    onSkillsOpenChange?.(true);
    if (skillsOpen === undefined) {
      setInternalSkillsOpen(true);
    }
  }

  function setSkillsDialogOpen(open: boolean) {
    if (open) {
      openSkillsDialog();
      return;
    }
    onSkillsOpenChange?.(false);
    if (skillsOpen === undefined) {
      setInternalSkillsOpen(false);
    }
  }

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a profile name");
      return;
    }
    try {
      await onCreate(trimmed);
      setCreateOpen(false);
      setName("");
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.detail : "Could not create profile",
      );
    }
  }

  async function handleRename() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Enter a profile name");
      return;
    }
    try {
      await onRename(trimmed);
      setRenameOpen(false);
      setName("");
      setError(null);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.detail : "Could not rename profile",
      );
    }
  }

  function addSkill() {
    const validationError = validateSkillLabel(skillInput, draftLabels);
    if (validationError) {
      setError(validationError);
      return;
    }
    setDraftLabels([...draftLabels, skillInput.trim()]);
    setSkillInput("");
    setError(null);
  }

  function removeSkill(label: string) {
    setDraftLabels(draftLabels.filter((item) => item !== label));
    setError(null);
  }

  async function handleSaveSkills() {
    setSavingSkills(true);
    setError(null);
    try {
      await onUpdateSkills(draftLabels);
      setSkillsDialogOpen(false);
      setSkillInput("");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.detail : "Could not update skills",
      );
    } finally {
      setSavingSkills(false);
    }
  }

  const picker = (
    <div className="flex items-center gap-2">
      <Select
        value={profile?.id ?? "offline"}
        onValueChange={(value) => {
          const next = profiles.find((item) => item.id === value);
          if (next) onSelect(next);
        }}
      >
        <SelectTrigger
          className="h-10 min-w-[108px] rounded-xl border-[#dfe2eb] bg-[#fafbfc]"
          aria-label="Select profile"
        >
          <Avatar className="size-6">
            <AvatarFallback className="bg-[#ececff] text-xs font-bold text-[#3d49df]">
              {profile?.display_name?.[0] ?? "?"}
            </AvatarFallback>
          </Avatar>
          <SelectValue>{profile?.display_name ?? "Profile"}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {profiles.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.display_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-xl"
              aria-label="Profile actions"
            />
          }
        >
          <UserRound className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => {
              setName("");
              setError(null);
              setCreateOpen(true);
            }}
          >
            <Plus className="size-4" />
            Create profile
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!profile}
            onClick={() => {
              setName(profile?.display_name ?? "");
              setError(null);
              setRenameOpen(true);
            }}
          >
            <Pencil className="size-4" />
            Rename profile
          </DropdownMenuItem>
          <DropdownMenuItem disabled={!profile} onClick={openSkillsDialog}>
            <Pencil className="size-4" />
            Edit skills
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <>
      {picker}
      {fallbackNotice && (
        <p className="sr-only" role="status">
          {fallbackNotice}
        </p>
      )}

      <AlertDialog open={createOpen} onOpenChange={setCreateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create profile</AlertDialogTitle>
            <AlertDialogDescription>
              Profiles are local identities for separate saved libraries.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            aria-label="Profile name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Profile name"
            className="rounded-xl"
          />
          {error && (
            <p className="text-sm text-[#b34438]" role="alert">
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleCreate()}>
              Create
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={renameOpen} onOpenChange={setRenameOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename profile</AlertDialogTitle>
            <AlertDialogDescription>
              Update the display name for this profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            aria-label="Profile name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="rounded-xl"
          />
          {error && (
            <p className="text-sm text-[#b34438]" role="alert">
              {error}
            </p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleRename()}>
              Save name
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={skillsDialogOpen} onOpenChange={setSkillsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit skills</AlertDialogTitle>
            <AlertDialogDescription>
              Skills belong to this profile and re-rank the next search under
              Best match. They never filter results out.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-3">
            {draftLabels.length === 0 ? (
              <p className="text-sm text-[#6d7690]">
                Add skills you care about so Best match can prioritize roles
                that mention them.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-2" aria-label="Profile skills">
                {draftLabels.map((label) => (
                  <li key={label}>
                    <Badge
                      variant="secondary"
                      className="gap-1 rounded-xl px-2.5 py-1"
                    >
                      {label}
                      <button
                        type="button"
                        className="rounded-md p-0.5 text-[#5e6780] hover:bg-[#eff0ff] hover:text-[#3d49df] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5964ed]"
                        aria-label={`Remove ${label}`}
                        onClick={() => removeSkill(label)}
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </button>
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex gap-2">
              <Input
                aria-label="New skill"
                value={skillInput}
                onChange={(event) => {
                  setSkillInput(event.target.value);
                  setError(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="e.g. TypeScript"
                className="rounded-xl"
              />
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={addSkill}
              >
                Add
              </Button>
            </div>
            {error && (
              <p className="text-sm text-[#b34438]" role="alert">
                {error}
              </p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={savingSkills}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={savingSkills || !profile}
              onClick={() => void handleSaveSkills()}
            >
              Save skills
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {mobileOpen !== undefined && onMobileOpenChange && (
        <AlertDialog open={mobileOpen} onOpenChange={onMobileOpenChange}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Profile</AlertDialogTitle>
              <AlertDialogDescription>
                Switch, create, rename, or edit skills for your local profile.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-3">{picker}</div>
            {fallbackNotice && (
              <p className="text-sm text-[#6d7690]">{fallbackNotice}</p>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
