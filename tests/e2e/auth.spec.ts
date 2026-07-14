import { test, expect } from "@playwright/test";

test.describe("CELCOM ERP PRO - Portal Core E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the main portal entry point
    await page.goto("/");
  });

  test("should load the staff login portal with correct branding and typography", async ({ page }) => {
    // Verify title and main headings are visible
    await expect(page.locator("h1")).toContainText("CELCOM NETWORKS");
    await expect(page.locator("text=Staff Authentication")).toBeVisible();
    
    // Check that primary input elements are loaded
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test("should perform navigation toggle to staff registration and forgot password views", async ({ page }) => {
    // Click on Forgot password button
    await page.click("text=Forgot password?");
    await expect(page.locator("text=Reset Security Key")).toBeVisible();

    // Go back to login portal
    await page.click("text=Return to Portal");
    await expect(page.locator("text=Staff Authentication")).toBeVisible();

    // Click on Register Staff Account button
    await page.click("text=Register Staff Account");
    await expect(page.locator("text=Account Onboarding Node")).toBeVisible();
  });

  test("should demonstrate visual accessibility and support dynamic credential helpers", async ({ page }) => {
    // Click on the Super Admin demo credentials assist button
    await page.click("text=Super Admin");

    // The inputs should automatically populate with demo emails
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveValue("admin@celcomnetworks.co.ke");

    // Toggle password eye icon to verify input visibility states
    const passwordInput = page.locator('input[id="login-password"]');
    await expect(passwordInput).toHaveAttribute("type", "password");

    // Click the eye icon button to reveal the string
    await page.click('button[title="Show password"]');
    await expect(passwordInput).toHaveAttribute("type", "text");
  });
});
