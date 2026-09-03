"use client";

import { useEffect, useRef } from "react";

import { isTransientNotice } from "@/components/job-scout/transient-notice";
import { toast } from "@/components/ui/toast";

/**
 * Promotes transient action outcomes to toasts. SearchStatus suppresses the
 * same strings from the inline strip so nothing is announced twice.
 */
export function NoticeToaster({ notice }: { notice: string }) {
  const lastToasted = useRef<string | null>(null);

  useEffect(() => {
    if (!notice || !isTransientNotice(notice)) return;
    if (lastToasted.current === notice) return;
    lastToasted.current = notice;
    toast.add({ title: notice, type: "success" });
  }, [notice]);

  return null;
}
