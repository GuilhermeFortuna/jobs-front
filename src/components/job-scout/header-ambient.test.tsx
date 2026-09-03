import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { HeaderAmbient } from "@/components/job-scout/header-ambient";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function stubMatchMedia(matches: Record<string, boolean>) {
  vi.stubGlobal(
    "matchMedia",
    (query: string) =>
      ({
        matches: Boolean(matches[query]),
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) satisfies MediaQueryList,
  );
}

describe("HeaderAmbient", () => {
  beforeEach(() => {
    document.documentElement.style.setProperty("--primary", "rgb(61, 73, 223)");
  });

  it("is decorative, non-interactive, and aria-hidden", () => {
    stubMatchMedia({
      "(prefers-reduced-motion: reduce)": false,
      "(max-width: 639px)": false,
    });
    render(<HeaderAmbient />);
    const ambient = screen.getByTestId("header-ambient");
    expect(ambient).toHaveAttribute("aria-hidden", "true");
    expect(ambient).toHaveClass("pointer-events-none");
    expect(ambient.tabIndex).toBe(-1);
  });

  it("renders a static fallback under prefers-reduced-motion", () => {
    stubMatchMedia({
      "(prefers-reduced-motion: reduce)": true,
      "(max-width: 639px)": false,
    });
    render(<HeaderAmbient />);
    expect(screen.getByTestId("header-ambient-static")).toBeInTheDocument();
  });

  it("renders a static fallback on narrow viewports", () => {
    stubMatchMedia({
      "(prefers-reduced-motion: reduce)": false,
      "(max-width: 639px)": true,
    });
    render(<HeaderAmbient />);
    expect(screen.getByTestId("header-ambient-static")).toBeInTheDocument();
  });
});
