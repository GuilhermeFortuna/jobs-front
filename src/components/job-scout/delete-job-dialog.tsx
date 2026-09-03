"use client";

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
import type { DisplayJob } from "@/lib/job-utils";
import { isSavedJob } from "@/lib/job-utils";

type DeleteJobDialogProps = {
  target: DisplayJob | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
};

export function DeleteJobDialog({
  target,
  onOpenChange,
  onConfirm,
}: DeleteJobDialogProps) {
  if (!target || !isSavedJob(target)) return null;

  return (
    <AlertDialog open onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove permanently?</AlertDialogTitle>
          <AlertDialogDescription>
            {target
              ? `“${target.title}” at ${target.company} will be deleted from this profile’s library. This cannot be undone.`
              : "This role will be deleted permanently."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            onClick={onConfirm}
          >
            Remove permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
