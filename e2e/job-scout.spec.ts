import { expect, test, type Page } from "@playwright/test";

import { fixtures } from "./fixtures";
import { DETAIL_PANE_BREAKPOINT_PX } from "../src/lib/breakpoints";

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

        if (url.endsWith("/searches") && method === "POST") {
          return json(data.searchComplete, 202);
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

test.beforeEach(async ({ page }) => {
  await installApiMock(page);
});

test("discover search and save journey", async ({ page }) => {
  await page.goto("/");
  await runExplicitSearch(page);
  await expect(
    page.getByRole("heading", { name: "Recommended roles" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Staff Engineer" }).first(),
  ).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByTestId("search-notice")).toContainText(
    /Search complete/,
    {
      timeout: 15_000,
    },
  );
  await expect(
    page
      .getByTestId("job-card")
      .filter({ hasText: "+1 sources" })
      .getByText(/\+1 sources/),
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
  await runExplicitSearch(page);
  await expect(
    page.getByRole("heading", { name: "Staff Engineer" }).first(),
  ).toBeVisible({
    timeout: 15_000,
  });
  // Single responsive navigation landmark with tab triggers for the three views.
  await page
    .getByRole("navigation")
    .getByRole("tab", { name: "saved" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Saved roles", exact: true }),
  ).toBeVisible();
  if (testInfo.project.name === "mobile") {
    await page.getByRole("heading", { name: "Staff Engineer" }).first().click();
  }
  await page.getByRole("button", { name: "Mark as applied" }).click();
  await expect(page.getByText("Marked as applied")).toBeVisible();
  if (testInfo.project.name === "mobile") {
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog", { name: "Job details" })).toHaveCount(
      0,
    );
  }
  await page
    .getByRole("navigation")
    .getByRole("tab", { name: "applied" })
    .click();
  await expect(
    page.getByRole("heading", { name: "Applications", exact: true }),
  ).toBeVisible();
  // Scoped to the job-card container so it can't match the desktop detail
  // pane's own "Staff Engineer" heading, without pinning a literal level.
  const cardTitle = page
    .getByTestId("job-card")
    .getByRole("heading", { name: "Staff Engineer" });
  if (testInfo.project.name === "mobile") {
    await cardTitle.click();
  } else {
    await expect(cardTitle).toBeVisible();
  }
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
  await runExplicitSearch(page);
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
  // Card heading opens the sheet; the detail heading is scoped to the
  // job-detail container (not just the dialog) because the sheet also
  // carries a visually-hidden dialog title with the same accessible name,
  // and neither assertion pins a literal heading level.
  await page
    .getByTestId("job-card")
    .getByRole("heading", { name: "Staff Engineer" })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByTestId("job-detail")
      .getByRole("heading", { name: "Staff Engineer" }),
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
  await runExplicitSearch(page);
  await expect(
    page.getByRole("heading", { name: "Staff Engineer" }).first(),
  ).toBeVisible({ timeout: 15_000 });
  await expect(
    page.getByRole("combobox", { name: "Select profile" }),
  ).toContainText("Gui");
  await expect(
    page.getByRole("combobox", { name: "Select profile" }),
  ).toHaveCount(1);
});

test("shell exposes a single navigation and header ambient", async ({
  page,
}) => {
  await installApiMock(page);
  await page.goto("/");
  await runExplicitSearch(page);
  await expect(
    page.getByRole("heading", { name: "Staff Engineer" }).first(),
  ).toBeVisible({ timeout: 15_000 });

  await expect(page.getByRole("navigation")).toHaveCount(1);
  const nav = page.getByRole("navigation");
  await expect(nav.getByRole("tab", { name: "discover" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await nav.getByRole("tab", { name: "saved" }).click();
  await expect(
    page.getByRole("heading", { name: "Saved roles", exact: true }),
  ).toBeVisible();
  await nav.getByRole("tab", { name: "applied" }).click();
  await expect(
    page.getByRole("heading", { name: "Applications", exact: true }),
  ).toBeVisible();
  await expect(nav.getByRole("tab", { name: "applied" })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await nav.getByRole("tab", { name: "discover" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(nav.getByRole("tab", { name: "saved" })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  const ambient = page.getByTestId("header-ambient");
  await expect(ambient).toHaveAttribute("aria-hidden", "true");
  await expect(ambient).toHaveCSS("pointer-events", "none");
  await expect(
    page.getByTestId("job-card").getByTestId("header-ambient"),
  ).toHaveCount(0);
  await expect(
    page.locator('[data-testid="job-detail"] [data-testid="header-ambient"]'),
  ).toHaveCount(0);
});

test("wide shell keeps search above cards and exposes resizable zones", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Desktop-only layout");
  await page.goto("/");

  await expect(
    page.getByRole("textbox", { name: "Search keywords" }).last(),
  ).toBeVisible();
  await expect(
    page.getByRole("separator", { name: "Resize filters panel" }),
  ).toBeVisible();
  const resultsHandle = page.getByRole("separator", {
    name: "Resize results panel",
  });
  await expect(resultsHandle).toHaveAttribute("aria-valuenow", "620");
  await resultsHandle.focus();
  await page.keyboard.press("ArrowRight");
  await expect(resultsHandle).toHaveAttribute("aria-valuenow", "636");
  const handleBox = await resultsHandle.boundingBox();
  expect(handleBox).not.toBeNull();
  await page.mouse.move(handleBox!.x + 4, handleBox!.y + 20);
  await page.mouse.down();
  await page.mouse.move(handleBox!.x + 44, handleBox!.y + 20);
  await page.mouse.up();
  await expect(resultsHandle).toHaveAttribute("aria-valuenow", "676");
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
  await runExplicitSearch(page);
  const searchStatus = page.getByTestId("search-status");
  await searchStatus.getByTestId("search-status-toggle").click();
  await expect(
    searchStatus
      .getByRole("status")
      .filter({ hasText: /Search partially complete/ }),
  ).toBeVisible({
    timeout: 15_000,
  });
  await expect(
    searchStatus.getByRole("status").filter({ hasText: /Jobicy unavailable/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Staff Engineer" }).first(),
  ).toBeVisible();
});

test("consolidated detail exposes every source and saves once", async ({
  page,
}) => {
  await page.goto("/");
  await runExplicitSearch(page);
  await expect(
    page.getByRole("heading", { name: "Staff Engineer" }).first(),
  ).toBeVisible({
    timeout: 15_000,
  });
  const isMobileLayout =
    Boolean(page.viewportSize()?.width) &&
    page.viewportSize()!.width < DETAIL_PANE_BREAKPOINT_PX;
  if (isMobileLayout) {
    await page
      .getByTestId("job-card")
      .getByRole("heading", { name: "Staff Engineer" })
      .click();
  }
  const detail = isMobileLayout
    ? page.getByRole("dialog")
    : page.getByRole("main");
  await detail.getByRole("tab", { name: "Sources" }).click();
  await expect(detail.getByText("Primary source")).toBeVisible();
  await expect(
    detail.getByRole("link", { name: "View Himalayas listing" }),
  ).toBeVisible();
  await expect(
    detail.getByRole("link", { name: "View Remote OK listing" }),
  ).toBeVisible();
  // The exact "Save" match (vs. "Saved"/"Move to saved") is intentional: it
  // protects JobDetail's three-way label logic, not just a locator
  // convenience. Do not loosen it.
  await detail.getByRole("button", { name: /^Save$/ }).click();
  await expect(page.getByText("Saved to your library")).toBeVisible({
    timeout: 10_000,
  });
});

test("provider filter offers only the providers the API reports", async ({
  page,
}, testInfo) => {
  await page.goto("/");
  await runExplicitSearch(page);
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
  await expect(
    page.getByRole("checkbox", { name: "Adzuna · Unavailable" }).first(),
  ).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Jobicy" })).toHaveCount(0);
});
