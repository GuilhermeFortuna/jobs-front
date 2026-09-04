import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const { toastAdd } = vi.hoisted(() => ({ toastAdd: vi.fn() }));

vi.mock("@/components/ui/toast", () => ({
  toast: { add: toastAdd },
}));

import { NoticeToaster } from "@/components/job-scout/notice-toaster";

afterEach(() => {
  cleanup();
  toastAdd.mockClear();
});

describe("NoticeToaster", () => {
  it("emits repeated action messages when they are distinct events", () => {
    const { rerender } = render(
      <NoticeToaster event={{ id: 1, message: "Saved to your library" }} />,
    );

    rerender(
      <NoticeToaster event={{ id: 2, message: "Saved to your library" }} />,
    );

    expect(toastAdd).toHaveBeenCalledTimes(2);
    expect(toastAdd).toHaveBeenLastCalledWith({
      title: "Saved to your library",
      type: "success",
    });
  });

  it("does not emit the same event twice", () => {
    const event = { id: 1, message: "Profile renamed" };
    const { rerender } = render(<NoticeToaster event={event} />);

    rerender(<NoticeToaster event={event} />);

    expect(toastAdd).toHaveBeenCalledTimes(1);
  });
});
