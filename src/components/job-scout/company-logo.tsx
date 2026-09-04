"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

const SIZE_CLASS = {
  sm: "size-12 text-lg rounded-xl",
  md: "size-14 text-xl rounded-2xl",
} as const;

export type CompanyLogoSize = keyof typeof SIZE_CLASS;

type CompanyLogoProps = {
  company: string;
  logoUrl?: string | null;
  size?: CompanyLogoSize;
  className?: string;
};

function LetterTile({
  company,
  size,
  className,
}: {
  company: string;
  size: CompanyLogoSize;
  className?: string;
}) {
  return (
    <div
      data-testid="company-logo-fallback"
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center bg-foreground font-bold text-background",
        SIZE_CLASS[size],
        className,
      )}
    >
      {company.slice(0, 1) || "?"}
    </div>
  );
}

/**
 * Shared company mark for job cards (JE-020) and detail (JE-021).
 * Falls back to a letter tile when the URL is missing or the image errors.
 */
export function CompanyLogo({
  company,
  logoUrl,
  size = "sm",
  className,
}: CompanyLogoProps) {
  // Key failure by URL so selecting another job retries its logo.
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = Boolean(logoUrl) && failedUrl !== logoUrl;

  if (!showImage) {
    return <LetterTile company={company} size={size} className={className} />;
  }

  const dimension = size === "md" ? 56 : 48;

  return (
    <div
      data-testid="company-logo"
      className={cn(
        "relative shrink-0 overflow-hidden bg-muted",
        SIZE_CLASS[size],
        className,
      )}
    >
      {/*
        `unoptimized` is load-bearing, not an optimization opt-out of
        convenience: it keeps `/_next/image` closed to remote hosts so
        `next.config.ts` needs no `remotePatterns` wildcard. See the decision
        recorded there before removing it.
      */}
      <Image
        src={logoUrl!}
        alt=""
        width={dimension}
        height={dimension}
        unoptimized
        loading="lazy"
        referrerPolicy="no-referrer"
        className="size-full object-contain"
        onError={() => setFailedUrl(logoUrl!)}
      />
    </div>
  );
}
