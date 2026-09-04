"use client";

/**
 * @author: @kokonutui
 * @description: AI Loading State (adapted for Job Scout search-in-progress)
 * @license: MIT
 * @website: https://kokonutui.com
 */

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type AILoadingSequence = {
  status: string;
  lines: string[];
};

const DEFAULT_SEQUENCES: AILoadingSequence[] = [
  {
    status: "Searching providers",
    lines: [
      "Contacting providers...",
      "Collecting matching roles...",
      "Merging duplicate listings...",
      "Ranking by relevance...",
    ],
  },
];

const LINE_HEIGHT = 28;
const VISIBLE_WINDOW = 3;

const LoadingAnimation = ({ progress }: { progress: number }) => (
  <div className="relative size-6">
    <svg
      aria-label={`Loading progress: ${Math.round(progress)}%`}
      className="size-full"
      fill="none"
      viewBox="0 0 240 240"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Loading Progress Indicator</title>
      <defs>
        <mask id="progress-mask">
          <rect fill="black" height="240" width="240" />
          <circle
            cx="120"
            cy="120"
            fill="white"
            r="120"
            strokeDasharray={`${(progress / 100) * 754}, 754`}
            transform="rotate(-90 120 120)"
          />
        </mask>
      </defs>
      <style>
        {`
          @keyframes rotate-cw {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes rotate-ccw {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }
          .g-spin circle {
            transform-origin: 120px 120px;
          }
          .g-spin circle:nth-child(1) { animation: rotate-cw 8s linear infinite; }
          .g-spin circle:nth-child(2) { animation: rotate-ccw 8s linear infinite; }
          .g-spin circle:nth-child(3) { animation: rotate-cw 8s linear infinite; }
          .g-spin circle:nth-child(4) { animation: rotate-ccw 8s linear infinite; }
          .g-spin circle:nth-child(5) { animation: rotate-cw 8s linear infinite; }
          .g-spin circle:nth-child(6) { animation: rotate-ccw 8s linear infinite; }
          .g-spin circle:nth-child(2n) { animation-delay: 0.2s; }
          .g-spin circle:nth-child(3n) { animation-delay: 0.3s; }
          @media (prefers-reduced-motion: reduce) {
            .g-spin circle { animation: none !important; }
          }
        `}
      </style>
      <g
        className="g-spin"
        mask="url(#progress-mask)"
        strokeDasharray="18% 40%"
        strokeWidth="16"
      >
        <circle
          cx="120"
          cy="120"
          opacity="0.95"
          r="150"
          className="stroke-primary"
        />
        <circle
          cx="120"
          cy="120"
          opacity="0.95"
          r="130"
          className="stroke-applied"
        />
        <circle
          cx="120"
          cy="120"
          opacity="0.95"
          r="110"
          className="stroke-success"
        />
        <circle
          cx="120"
          cy="120"
          opacity="0.95"
          r="90"
          className="stroke-warning"
        />
        <circle
          cx="120"
          cy="120"
          opacity="0.85"
          r="70"
          className="stroke-info"
        />
        <circle
          cx="120"
          cy="120"
          opacity="0.85"
          r="50"
          className="stroke-primary"
        />
      </g>
    </svg>
  </div>
);

type AILoadingStateProps = {
  sequences?: AILoadingSequence[];
  progress: number;
  className?: string;
};

export default function AILoadingState({
  sequences = DEFAULT_SEQUENCES,
  progress,
  className,
}: AILoadingStateProps) {
  const safeSequences = sequences.length > 0 ? sequences : DEFAULT_SEQUENCES;
  const sequenceKey = safeSequences
    .map((seq) => `${seq.status}:${seq.lines.join("|")}`)
    .join("||");

  const [tick, setTick] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const element = rootRef.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { rootMargin: "100px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    const timer = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 2000);
    return () => clearInterval(timer);
  }, [isVisible, sequenceKey]);

  const totalLinesInCycle = safeSequences.reduce(
    (sum, seq) => sum + Math.max(seq.lines.length, 1),
    0,
  );
  const absoluteLine = totalLinesInCycle > 0 ? tick % totalLinesInCycle : 0;

  let cursor = absoluteLine;
  let sequenceIndex = 0;
  let lineIndex = 0;
  for (let i = 0; i < safeSequences.length; i++) {
    const count = Math.max(safeSequences[i]!.lines.length, 1);
    if (cursor < count) {
      sequenceIndex = i;
      lineIndex = cursor;
      break;
    }
    cursor -= count;
  }

  const currentSequence = safeSequences[sequenceIndex]!;
  const windowStart = Math.max(0, lineIndex - VISIBLE_WINDOW + 1);
  const visibleLines = currentSequence.lines
    .slice(windowStart, lineIndex + 1)
    .map((text, offset) => ({
      text,
      number: windowStart + offset + 1,
    }));

  const progressPct = Math.min(100, Math.max(0, progress * 100));

  return (
    <div
      className={cn("flex w-full items-center justify-center", className)}
      ref={rootRef}
      data-testid="ai-loading"
    >
      <div className="w-full max-w-md space-y-3">
        <div className="ml-1 flex items-center gap-2 font-medium text-muted-foreground">
          <LoadingAnimation progress={progressPct} />
          <span className="text-sm text-foreground">
            {currentSequence.status}…
          </span>
        </div>

        <div className="relative">
          <div className="relative h-[84px] w-full overflow-hidden rounded-lg bg-muted/40 font-mono text-xs">
            <div>
              {visibleLines.map((line) => (
                <div
                  className="flex h-[28px] items-center px-2"
                  key={`${line.number}-${line.text}`}
                  style={{ height: LINE_HEIGHT }}
                >
                  <div className="w-6 select-none pr-3 text-right text-muted-foreground">
                    {line.number}
                  </div>
                  <div className="ml-1 min-w-0 flex-1 truncate text-foreground">
                    {line.text}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-b from-card/90 via-card/40 to-transparent" />
        </div>
      </div>
    </div>
  );
}
