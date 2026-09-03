/**
 * Capture JE-016 design references at project viewports.
 * Run: CAPTURE_REFS=1 pnpm exec playwright test e2e/capture-design-refs.spec.ts
 */
import { test, type Page } from "@playwright/test";
import path from "node:path";

import { fixtures } from "./fixtures";

const OUT = path.join(process.cwd(), "docs/design");

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

        if (url.includes("/searches/") && method === "GET") {
          return json(data.searchComplete);
        }

        if (url.includes("/profiles/") && url.includes("/jobs")) {
          if (method === "GET" && /\/jobs(\?|$)/.test(url)) {
            return json([data.savedJob]);
          }
        }

        if (url.includes("/profiles/") && method === "GET") {
          return json(data.profileList[0]);
        }

        return originalFetch(input, init);
      };
    },
    {
      profileList: [{ ...fixtures.profile, skills: ["TypeScript", "React"] }],
      providerList: fixtures.providerList,
      searchRefreshComplete: fixtures.searchRefreshComplete,
      searchComplete: {
        ...fixtures.searchComplete,
        items: fixtures.searchComplete.items.map((job) => ({
          ...job,
          matched_skills: ["TypeScript"],
        })),
      },
      savedJob: fixtures.savedJob,
    },
  );
}

test.describe("design reference capture", () => {
  test.skip(
    !process.env.CAPTURE_REFS,
    "Set CAPTURE_REFS=1 to write docs/design reference PNGs",
  );

  test("desktop light and dark", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "desktop only");
    await installApiMock(page);

    await page.addInitScript(() => {
      localStorage.setItem("job-scout-theme", "light");
    });
    await page.goto("/");
    await page
      .getByRole("heading", { name: "Staff Engineer" })
      .first()
      .waitFor({ timeout: 15_000 });
    await page.screenshot({
      path: path.join(OUT, "job-scout-desktop-light.png"),
      fullPage: false,
    });

    await page.getByRole("button", { name: /Theme/i }).click();
    await page.getByRole("menuitem", { name: "Dark" }).click({ force: true });
    await page.locator("html.dark").waitFor();
    await page.keyboard.press("Escape");
    await page.getByRole("menu").waitFor({ state: "hidden" });
    await page.screenshot({
      path: path.join(OUT, "job-scout-desktop-dark.png"),
      fullPage: false,
    });
  });

  test("mobile light and dark", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "mobile only");
    await installApiMock(page);

    await page.addInitScript(() => {
      localStorage.setItem("job-scout-theme", "light");
    });
    await page.goto("/");
    await page
      .getByRole("heading", { name: "Staff Engineer" })
      .first()
      .waitFor({ timeout: 15_000 });
    await page.screenshot({
      path: path.join(OUT, "job-scout-mobile-light.png"),
      fullPage: false,
    });

    await page.getByRole("button", { name: /Theme/i }).click();
    await page.getByRole("menuitem", { name: "Dark" }).click({ force: true });
    await page.locator("html.dark").waitFor();
    await page.keyboard.press("Escape");
    await page.getByRole("menu").waitFor({ state: "hidden" });
    await page.screenshot({
      path: path.join(OUT, "job-scout-mobile-dark.png"),
      fullPage: false,
    });
  });
});
