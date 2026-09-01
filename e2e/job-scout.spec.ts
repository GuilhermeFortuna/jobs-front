import { expect, test, type Page } from "@playwright/test";

import { fixtures } from "./fixtures";

type SearchFixture = typeof fixtures.searchComplete;
type SearchRefreshFixture = typeof fixtures.searchRefreshComplete;

async function installApiMock(
  page: Page,
  options?: {
    searchComplete?: SearchFixture;
    searchRefreshComplete?: SearchRefreshFixture;
  },
) {
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
            const state = url.includes("state=applied") ? "applied" : "saved";
            const job =
              state === "applied"
                ? {
                    ...data.savedJob,
                    state: "applied",
                    applied_at: "2026-01-12T00:00:00Z",
                  }
                : data.savedJob;
            return json([job]);
          }
          if (method === "POST") {
            return json(data.savedJob, 201);
          }
          if (method === "PATCH") {
            const body = JSON.parse(String(init?.body ?? "{}")) as {
              state: string;
            };
            return json({
              ...data.savedJob,
              state: body.state,
              applied_at:
                body.state === "applied" ? "2026-01-12T00:00:00Z" : null,
            });
          }
          if (method === "DELETE") {
            return new Response(null, { status: 204 });
          }
        }

        return originalFetch(input, init);
      };
    },
    {
      profileList: [fixtures.profile],
      providerList: fixtures.providerList,
      searchRefreshComplete:
        options?.searchRefreshComplete ?? fixtures.searchRefreshComplete,
      searchComplete: options?.searchComplete ?? fixtures.searchComplete,
      savedJob: fixtures.savedJob,
    },
  );
}

test.beforeEach(async ({ page }) => {
  await installApiMock(page);
});

test("discover search and save journey", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Recommended roles" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Staff Engineer" }).first(),
  ).toBeVisible({
    timeout: 15_000,
  });
  await expect(
    page.locator("span.min-w-0.break-words", { hasText: /Search complete/ }),
  ).toBeVisible({
    timeout: 15_000,
  });
  await expect(
    page.getByRole("article").getByText(/\+1 sources/),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /Save Staff Engineer/i })
    .first()
    .click();
  await expect(page.getByText("Saved to your library")).toBeVisible({
    timeout: 10_000,
  });
});

test("library state move and delete confirmation", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Staff Engineer" }).first(),
  ).toBeVisible({
    timeout: 15_000,
  });
  if (testInfo.project.name === "mobile") {
    await page
      .getByRole("navigation", { name: "Mobile navigation" })
      .getByRole("button", { name: "saved" })
      .click();
  } else {
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("button", { name: "saved" })
      .click();
  }
  await expect(
    page.getByRole("heading", { name: "Saved roles", exact: true }),
  ).toBeVisible();
  if (testInfo.project.name === "mobile") {
    await page.getByRole("heading", { name: "Staff Engineer" }).first().click();
  }
  await page.getByRole("button", { name: "Mark as applied" }).click();
  await expect(page.getByText("Marked as applied")).toBeVisible();
  await page
    .getByRole("button", { name: "Remove permanently" })
    .first()
    .click();
  await expect(page.getByText("Remove permanently?")).toBeVisible();
  await page.getByRole("button", { name: "Remove permanently" }).last().click();
  await expect(page.getByText("Removed permanently")).toBeVisible();
});

test("mobile opens filter and detail sheets", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile", "Mobile-only journey");
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Staff Engineer" }).first(),
  ).toBeVisible({
    timeout: 15_000,
  });
  await page.getByRole("button", { name: "Open filters" }).click();
  await expect(
    page.getByRole("dialog", { name: "Search filters" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("heading", { level: 3, name: "Staff Engineer" }).click();
  await expect(
    page.getByRole("heading", { level: 2, name: "Staff Engineer" }).last(),
  ).toBeVisible();
});

test("profile isolation uses remembered profile id", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "job-scout-profile",
      "11111111-1111-1111-1111-111111111111",
    );
  });
  await installApiMock(page);
  await page.goto("/");
  await expect(
    page.getByRole("combobox", { name: "Select profile" }),
  ).toContainText("Gui");
});

test("degraded search reads as partial and names the failed provider", async ({
  page,
}) => {
  await installApiMock(page, {
    searchComplete: fixtures.searchPartialComplete as SearchFixture,
    searchRefreshComplete: {
      ...fixtures.searchPartialComplete,
      previous_search_id: null,
      serving_search_id: fixtures.searchPartialComplete.search_id,
    } as SearchRefreshFixture,
  });
  await page.goto("/");
  await expect(
    page.getByRole("status").filter({ hasText: /Search partially complete/ }),
  ).toBeVisible({
    timeout: 15_000,
  });
  await expect(
    page.getByRole("status").filter({ hasText: /Jobicy unavailable/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Staff Engineer" }).first(),
  ).toBeVisible();
});

test("consolidated detail exposes every source and saves once", async ({
  page,
}) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Staff Engineer" }).first(),
  ).toBeVisible({
    timeout: 15_000,
  });
  if (page.viewportSize()?.width && page.viewportSize()!.width < 1280) {
    await page
      .getByRole("heading", { level: 3, name: "Staff Engineer" })
      .click();
  }
  const detail =
    page.viewportSize()?.width && page.viewportSize()!.width < 1280
      ? page.getByRole("dialog")
      : page.getByRole("main");
  await expect(detail.getByText("Primary source")).toBeVisible();
  await expect(
    detail.getByRole("link", { name: "View Himalayas listing" }),
  ).toBeVisible();
  await expect(
    detail.getByRole("link", { name: "View Remote OK listing" }),
  ).toBeVisible();
  await detail.getByRole("button", { name: /^Save$/ }).click();
  await expect(page.getByText("Saved to your library")).toBeVisible({
    timeout: 10_000,
  });
});

test("provider filter offers only the providers the API reports", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Staff Engineer" }).first(),
  ).toBeVisible({ timeout: 15_000 });

  if (testInfo.project.name === "mobile") {
    await page.getByRole("button", { name: "Open filters" }).click();
    await expect(
      page.getByRole("dialog", { name: "Search filters" }),
    ).toBeVisible();
  }

  await expect(
    page.getByRole("checkbox", { name: "Himalayas" }).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "Remote OK" }).first(),
  ).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Jobicy" })).toHaveCount(0);
});
