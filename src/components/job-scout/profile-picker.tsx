"use client";

import { useState } from "react";
import { Pencil, Plus, UserRound, X } from "lucide-react";

import {
  AlertDialog,
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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
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
          className="h-10 min-w-[108px] rounded-xl border-border bg-surface"
          aria-label="Select profile"
        >
          <Avatar className="size-6">
            <AvatarFallback className="bg-primary-soft text-xs font-bold text-primary">
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
              title="Profile actions"
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

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create profile</DialogTitle>
            <DialogDescription>
              Profiles are local identities for separate saved libraries.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel className="sr-only">Profile name</FieldLabel>
              <Input
                aria-label="Profile name"
                aria-invalid={error ? true : undefined}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Profile name"
                className="rounded-xl"
              />
              {error && <FieldError>{error}</FieldError>}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button onClick={() => void handleCreate()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename profile</DialogTitle>
            <DialogDescription>
              Update the display name for this profile.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field data-invalid={error ? true : undefined}>
              <FieldLabel className="sr-only">Profile name</FieldLabel>
              <Input
                aria-label="Profile name"
                aria-invalid={error ? true : undefined}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="rounded-xl"
              />
              {error && <FieldError>{error}</FieldError>}
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button onClick={() => void handleRename()}>Save name</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={skillsDialogOpen} onOpenChange={setSkillsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit skills</DialogTitle>
            <DialogDescription>
              Skills belong to this profile and re-rank the next search under
              Best match. They never filter results out.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            {draftLabels.length === 0 ? (
              <p className="text-sm text-muted-foreground">
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
                        className="rounded-md p-0.5 text-muted-foreground hover:bg-accent hover:text-primary focus-ring"
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
            <FieldGroup>
              <Field data-invalid={error ? true : undefined}>
                <FieldLabel className="sr-only">New skill</FieldLabel>
                <div className="flex gap-2">
                  <Input
                    aria-label="New skill"
                    aria-invalid={error ? true : undefined}
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
                {error && <FieldError>{error}</FieldError>}
              </Field>
            </FieldGroup>
          </div>
          <DialogFooter>
            <DialogClose
              render={<Button variant="outline" disabled={savingSkills} />}
            >
              Cancel
            </DialogClose>
            <Button
              disabled={savingSkills || !profile}
              onClick={() => void handleSaveSkills()}
            >
              Save skills
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {mobileOpen !== undefined && onMobileOpenChange && (
        <AlertDialog open={mobileOpen} onOpenChange={onMobileOpenChange}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Profile</AlertDialogTitle>
              <AlertDialogDescription>
                Switch, create, rename, or edit skills for your local profile.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium">
                {profile?.display_name ?? "No profile selected"}
              </p>
              <ul className="flex flex-col gap-1" aria-label="Switch profile">
                {profiles.map((item) => (
                  <li key={item.id}>
                    <Button
                      type="button"
                      variant={item.id === profile?.id ? "secondary" : "ghost"}
                      className="w-full justify-start rounded-xl"
                      aria-current={
                        item.id === profile?.id ? "true" : undefined
                      }
                      onClick={() => {
                        onSelect(item);
                        onMobileOpenChange(false);
                      }}
                    >
                      {item.display_name}
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-1">
                <Button
                  type="button"
                  variant="outline"
                  className="justify-start rounded-xl"
                  onClick={() => {
                    setName("");
                    setError(null);
                    setCreateOpen(true);
                    onMobileOpenChange(false);
                  }}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Create profile
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="justify-start rounded-xl"
                  disabled={!profile}
                  onClick={() => {
                    setName(profile?.display_name ?? "");
                    setError(null);
                    setRenameOpen(true);
                    onMobileOpenChange(false);
                  }}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Rename profile
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="justify-start rounded-xl"
                  disabled={!profile}
                  onClick={() => {
                    openSkillsDialog();
                    onMobileOpenChange(false);
                  }}
                >
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit skills
                </Button>
              </div>
              {fallbackNotice && (
                <p className="text-sm text-muted-foreground" role="status">
                  {fallbackNotice}
                </p>
              )}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
