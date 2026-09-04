"use client";

import { useEffect, useRef } from "react";

import { toast } from "@/components/ui/toast";

export type ActionNotice = {
  id: number;
  message: string;
};

/**
 * Promotes action outcomes to toasts. Event identities let repeated actions
 * announce the same message without replaying an already-rendered event.
 */
export function NoticeToaster({ event }: { event: ActionNotice | null }) {
  const lastToastedId = useRef<number | null>(null);
  const eventId = event?.id;
  const eventMessage = event?.message;

  useEffect(() => {
    if (eventId === undefined || !eventMessage) return;
    if (lastToastedId.current === eventId) return;
    lastToastedId.current = eventId;
    toast.add({ title: eventMessage, type: "success" });
  }, [eventId, eventMessage]);

  return null;
}
