import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";

function renderToggle() {
  return render(
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      storageKey="job-scout-theme"
    >
      <ThemeToggle />
    </ThemeProvider>,
  );
}

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove("dark", "light");
  });

  afterEach(() => {
    cleanup();
  });

  it("persists an explicit light selection", async () => {
    const user = userEvent.setup();
    renderToggle();

    await user.click(await screen.findByRole("button", { name: /Theme/i }));
    await user.click(await screen.findByRole("menuitem", { name: /Light/i }));

    await waitFor(() => {
      expect(localStorage.getItem("job-scout-theme")).toBe("light");
    });
  });

  it("applies a stored dark preference to the document", async () => {
    localStorage.setItem("job-scout-theme", "dark");
    renderToggle();

    await waitFor(() => {
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });
});
