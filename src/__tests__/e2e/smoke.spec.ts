import { test, expect } from "@playwright/test";

/**
 * Smoke tests. These are the "did I break the app booting" regression gate.
 * They do not require test fixtures or seeded data — they exercise public routes
 * that must load for any user to reach the app at all. Commerce-flow tests
 * (booking / order / job application) live in their own spec files with
 * authenticated fixtures.
 */

test("home page loads", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.ok()).toBeTruthy();
});

test("login page loads", async ({ page }) => {
  const res = await page.goto("/login");
  expect(res?.ok()).toBeTruthy();
  await expect(page.locator("form")).toBeVisible();
});

test("signup page loads", async ({ page }) => {
  const res = await page.goto("/signup");
  expect(res?.ok()).toBeTruthy();
  await expect(page.locator("form")).toBeVisible();
});

test("unauthenticated /dashboard redirects to /login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("unauthenticated /admin redirects to /login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
});

test("public content routes are reachable", async ({ page }) => {
  for (const path of [
    "/events",
    "/food",
    "/business",
    "/jobs",
    "/resources",
    "/culture",
    "/health",
    "/people",
  ]) {
    const res = await page.goto(path);
    expect(res?.ok(), `expected ${path} to return 2xx`).toBeTruthy();
  }
});
