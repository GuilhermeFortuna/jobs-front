import { expect, test, type Page } from "@playwright/test";

import { fixtures } from "./fixtures";

async function installApiMock(page: Page) {
  await page.addInitScript(
    (data) => {
      const originalFetch = window.fetch.bind(window);

      window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        const url =
          typeof input === "string"
            ? input
            : input instanceof URL
              ? input.href
              : input.url;
        const method = (init?.method ?? "GET").toUpperCase();

        if (!url.includes(":8000")) {
          return originalFetch(input, init);
        }

        const json = (body: unknown, status = 200) =>
          new Response(JSON.stringify(body), {
            status,
            headers: { "Content-Type": "application/json" },
          });

        if (url.endsWith("/health")) {
          return json({ status: "ok" });
        }

        if (url.endsWith("/profiles") && method === "GET") {
          return json(data.profileList);
        }

        if (url.endsWith("/providers") && method === "GET") {
          return json(data.providerList);
        }

        if (url.includes("/default-search/refresh") && method === "POST") {
          return json(data.searchRefreshComplete, 202);
        }

        if (url.endsWith("/searches") && method === "POST") {
          return json(data.searchComplete, 202);
        }

        if (url.includes("/searches/") && method === "GET") {
          return json(data.searchComplete);
        }

        if (url.includes("/profiles/") && url.includes("/jobs")) {
          if (method === "GET" && /\/jobs(\?|$)/.test(url)) {
            return json([data.savedJob]);
          }
        }

        return originalFetch(input, init);
      };
    },
    {
      profileList: [fixtures.profile],
      providerList: fixtures.providerList,
      searchRefreshComplete: fixtures.searchRefreshComplete,
      searchComplete: fixtures.searchComplete,
      savedJob: fixtures.savedJob,
    },
  );
}

async function chooseTheme(page: Page, label: "Light" | "Dark" | "System") {
  const themeButton = page.getByRole("button", { name: /Theme/i });
  await expect(themeButton).toHaveCount(1);
  await themeButton.click();
  const option = page.getByRole("menuitem", { name: label });
  await expect(option).toBeVisible();
  await option.click({ force: true });
  await expect(page.getByRole("menu")).toHaveCount(0);
}

async function runExplicitSearch(page: Page) {
  const searchButton = page
    .locator("button:visible")
    .filter({ hasText: "Search these roles" })
    .first();
  if (!(await searchButton.isVisible())) {
    await page.getByRole("button", { name: "Open filters" }).click();
  }
  await expect(searchButton).toBeEnabled();
  await searchButton.click();
  await page.keyboard.press("Escape");
}

test.describe("theme switching", () => {
  test("applies stored dark theme on first load without light class", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem("job-scout-theme", "dark");
    });
    await installApiMock(page);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.locator("html")).toHaveClass(/dark/);
    const { bodyBg, tokenBg, lightBg } = await page.evaluate(() => {
      const probe = document.createElement("div");
      probe.style.backgroundColor = "var(--background)";
      document.body.appendChild(probe);
      const token = getComputedStyle(probe).backgroundColor;
      probe.remove();

      // Light theme token for a not-equal check without hardcoding JE-016 hex.
      const wasDark = document.documentElement.classList.contains("dark");
      document.documentElement.classList.remove("dark");
      const lightProbe = document.createElement("div");
      lightProbe.style.backgroundColor = "var(--background)";
      document.body.appendChild(lightProbe);
      const light = getComputedStyle(lightProbe).backgroundColor;
      lightProbe.remove();
      if (wasDark) document.documentElement.classList.add("dark");

      return {
        bodyBg: getComputedStyle(document.body).backgroundColor,
        tokenBg: token,
        lightBg: light,
      };
    });
    expect(bodyBg).toBe(tokenBg);
    expect(bodyBg).not.toBe(lightBg);
  });

  test("theme toggle switches light, dark, and system", async ({ page }) => {
    await installApiMock(page);
    await page.goto("/");
    await runExplicitSearch(page);
    await expect(
      page.getByRole("heading", { name: "Staff Engineer" }).first(),
    ).toBeVisible({ timeout: 15_000 });

    await chooseTheme(page, "Dark");
    await expect(page.locator("html")).toHaveClass(/dark/);
    expect(
      await page.evaluate(() => localStorage.getItem("job-scout-theme")),
    ).toBe("dark");

    await chooseTheme(page, "Light");
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    expect(
      await page.evaluate(() => localStorage.getItem("job-scout-theme")),
    ).toBe("light");

    await chooseTheme(page, "System");
    expect(
      await page.evaluate(() => localStorage.getItem("job-scout-theme")),
    ).toBe("system");
  });

  test("system preference change while open is reflected", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await installApiMock(page);
    await page.addInitScript(() => {
      localStorage.setItem("job-scout-theme", "system");
    });
    await page.goto("/");
    await expect(page.locator("html")).not.toHaveClass(/dark/);

    await page.emulateMedia({ colorScheme: "dark" });
    await expect(page.locator("html")).toHaveClass(/dark/);
  });
});
