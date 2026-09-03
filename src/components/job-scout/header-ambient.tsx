"use client";

import { useEffect, useState } from "react";

import { FlickeringGrid } from "@/components/ui/flickering-grid";
import { cn } from "@/lib/utils";

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return reduced;
}

function useNarrowViewport(): boolean {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const sync = () => setNarrow(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return narrow;
}

function useThemePrimaryColor(): string {
  const [color, setColor] = useState("rgb(61, 73, 223)");

  useEffect(() => {
    const read = () => {
      const raw = getComputedStyle(document.documentElement)
        .getPropertyValue("--primary")
        .trim();
      if (raw) setColor(raw);
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    });
    return () => observer.disconnect();
  }, []);

  return color;
}

/**
 * Header-band ambient treatment. Confined to the header; decorative only.
 * Animated flickering grid on sm+ when motion is allowed; static elsewhere.
 */
export function HeaderAmbient({ className }: { className?: string }) {
  const reducedMotion = usePrefersReducedMotion();
  const narrow = useNarrowViewport();
  const color = useThemePrimaryColor();
  const animate = !reducedMotion && !narrow;

  return (
    <div
      data-testid="header-ambient"
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {animate ? (
        <FlickeringGrid
          className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black_40%,transparent)]"
          squareSize={3}
          gridGap={5}
          flickerChance={0.12}
          maxOpacity={0.18}
          color={color}
        />
      ) : (
        <div
          data-testid="header-ambient-static"
          className="absolute inset-0 opacity-[0.12] [mask-image:linear-gradient(to_bottom,black_40%,transparent)]"
          style={{
            backgroundImage: `radial-gradient(circle, ${color} 1px, transparent 1px)`,
            backgroundSize: "10px 10px",
          }}
        />
      )}
    </div>
  );
}
