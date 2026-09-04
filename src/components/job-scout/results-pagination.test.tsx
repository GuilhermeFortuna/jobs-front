import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ResultsPagination } from "@/components/job-scout/results-pagination";

afterEach(cleanup);

describe("ResultsPagination", () => {
  it("announces the current page to assistive technology", () => {
    render(
      <ResultsPagination page={2} totalPages={6} onPageChange={vi.fn()} />,
    );
    expect(screen.getByText("Page 2 of 6")).toBeInTheDocument();
  });

  it("moves to the next and previous page", () => {
    const onPageChange = vi.fn();
    render(
      <ResultsPagination page={2} totalPages={6} onPageChange={onPageChange} />,
    );

    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(onPageChange).toHaveBeenLastCalledWith(3);

    fireEvent.click(screen.getByRole("button", { name: /previous/i }));
    expect(onPageChange).toHaveBeenLastCalledWith(1);
  });

  it("takes the disabled edge out of the tab order rather than only blocking the mouse", () => {
    const onPageChange = vi.fn();
    render(
      <ResultsPagination page={1} totalPages={3} onPageChange={onPageChange} />,
    );

    const previous = screen.getByRole("button", { name: /previous/i });
    expect(previous).toHaveAttribute("aria-disabled", "true");
    expect(previous).toHaveAttribute("tabindex", "-1");

    fireEvent.click(previous);
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("does not page past the last page", () => {
    const onPageChange = vi.fn();
    render(
      <ResultsPagination page={3} totalPages={3} onPageChange={onPageChange} />,
    );

    const next = screen.getByRole("button", { name: /next/i });
    expect(next).toHaveAttribute("aria-disabled", "true");
    expect(next).toHaveAttribute("tabindex", "-1");

    fireEvent.click(next);
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it("never navigates, even on keyboard activation", () => {
    render(
      <ResultsPagination page={2} totalPages={3} onPageChange={vi.fn()} />,
    );
    const next = screen.getByRole("button", { name: /next/i });
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    next.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it("renders no interactive control for the current page indicator", () => {
    render(
      <ResultsPagination page={2} totalPages={3} onPageChange={vi.fn()} />,
    );
    // Previous and Next only — the indicator must not be a control to nowhere.
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });
});
