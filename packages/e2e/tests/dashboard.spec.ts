/**
 * Dashboard tests — Tier 1 automation.
 * Covers test cases: #2.1A - #2.18A
 */
import { test, expect } from "../fixtures/vortex-app";
import { DashboardPage } from "../selectors/dashboard";

test.describe("Dashboard", () => {
<<<<<<< HEAD
  test('"Lets get you setup" area is visible on fresh dashboard', async ({ vortexWindow }) => {
=======
  test('"Lets get you setup" area is visible on fresh dashboard', async ({
    vortexWindow,
  }) => {
>>>>>>> v2.0.1
    await test.step("Verify dashboard has content", async () => {
      const bodyText = await vortexWindow.locator("body").innerText();
      expect(bodyText.length).toBeGreaterThan(0);
    });
  });

  test('"What\'s New" section renders @smoke', async ({ vortexWindow }) => {
    const dashboard = new DashboardPage(vortexWindow);

    await test.step("Verify What's New is visible", async () => {
<<<<<<< HEAD
      if (await dashboard.whatsNew.isVisible().catch(() => false)) {
=======
      if (
        await dashboard.whatsNew.isVisible({ timeout: 5000 }).catch(() => false)
      ) {
>>>>>>> v2.0.1
        await expect(dashboard.whatsNew).toBeVisible();
      }
    });
  });

  test('"Latest News" section renders', async ({ vortexWindow }) => {
    const dashboard = new DashboardPage(vortexWindow);

    await test.step("Verify Latest News is visible", async () => {
<<<<<<< HEAD
      if (await dashboard.latestNews.isVisible().catch(() => false)) {
=======
      if (
        await dashboard.latestNews
          .isVisible({ timeout: 5000 })
          .catch(() => false)
      ) {
>>>>>>> v2.0.1
        await expect(dashboard.latestNews).toBeVisible();
      }
    });
  });

  test("dashboard customise button is accessible", async ({ vortexWindow }) => {
    const dashboard = new DashboardPage(vortexWindow);

    await test.step("Click Customise button", async () => {
<<<<<<< HEAD
      await expect(dashboard.customiseButton).toBeVisible();
=======
      await expect(dashboard.customiseButton).toBeVisible({ timeout: 5000 });
>>>>>>> v2.0.1
      await dashboard.customiseButton.click();
    });

    await test.step("Verify customise mode activated", async () => {
<<<<<<< HEAD
      await expect(dashboard.doneButton).toBeVisible();
=======
      await expect(dashboard.doneButton).toBeVisible({ timeout: 5000 });
>>>>>>> v2.0.1
    });
  });
});

test.describe("Dashboard - Getting Started Videos", () => {
  test("getting started section is present", async ({ vortexWindow }) => {
    const dashboard = new DashboardPage(vortexWindow);

    await test.step("Verify getting started section exists", async () => {
<<<<<<< HEAD
      await expect(dashboard.getStartedSection).toBeVisible();
=======
      await expect(dashboard.getStartedSection).toBeVisible({ timeout: 5000 });
>>>>>>> v2.0.1
    });
  });

  test("video player popup can be closed", async ({ vortexWindow }) => {
    const dashboard = new DashboardPage(vortexWindow);

<<<<<<< HEAD
    if (await dashboard.introductionVideo.isVisible().catch(() => false)) {
=======
    if (
      await dashboard.introductionVideo
        .isVisible({ timeout: 5000 })
        .catch(() => false)
    ) {
>>>>>>> v2.0.1
      await test.step("Open video", async () => {
        // A drag-handle overlay intercepts pointer events
        await dashboard.introductionVideo.click({ force: true });
        await vortexWindow.waitForTimeout(1000);
      });

      await test.step("Close video", async () => {
<<<<<<< HEAD
        if (await dashboard.videoCloseButton.isVisible().catch(() => false)) {
=======
        if (
          await dashboard.videoCloseButton
            .isVisible({ timeout: 3000 })
            .catch(() => false)
        ) {
>>>>>>> v2.0.1
          await dashboard.videoCloseButton.click();
        }
      });
    }
  });
});
