import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { JobCardSkeleton } from "@/components/job-scout/job-card-skeleton";
import { JOB_CARD_SHELL_CLASS } from "@/components/job-scout/job-card";

afterEach(cleanup);

describe("JobCardSkeleton", () => {
  /**
   * The skeleton only prevents reflow while it keeps the card's geometry.
   * jsdom has no layout, so assert the thing that would actually drift: the
   * shared shell class and the same card primitive slots.
   */
  it("renders the same shell geometry as the real card", () => {
    render(<JobCardSkeleton />);
    const skeleton = screen.getByTestId("job-card-skeleton");

    for (const token of JOB_CARD_SHELL_CLASS.split(" ")) {
      expect(skeleton).toHaveClass(token);
    }
    expect(skeleton).toHaveAttribute("data-slot", "card");
    expect(skeleton).toHaveAttribute("data-size", "sm");
  });

  it("occupies the card's header and content rows", () => {
    const { container } = render(<JobCardSkeleton />);
    expect(
      container.querySelector('[data-slot="card-header"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="card-content"]'),
    ).toBeInTheDocument();
  });

  it("is hidden from assistive technology", () => {
    render(<JobCardSkeleton />);
    expect(screen.getByTestId("job-card-skeleton")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});
