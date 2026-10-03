const { test, expect } = require("@playwright/test");
test("shopper can filter, inspect a product and get catalogue recommendations", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /A little more/ }),
  ).toBeVisible();
  await expect(
    page.getByText("You’re exploring a sample collection."),
  ).toBeVisible();
  if (process.env.VIRTUAL_REALM_SCREENSHOTS)
    await page.screenshot({
      path: `${process.env.VIRTUAL_REALM_SCREENSHOTS}/${test.info().project.name}.png`,
      fullPage: true,
    });
  await page.getByRole("button", { name: "Electronics", exact: true }).click();
  await expect(page.locator(".product-card")).toHaveCount(3);
  await page.getByLabel("Search collection").fill("headphones");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page
    .getByRole("heading", { name: "Studio Wireless Headphones", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Studio Wireless Headphones" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Add to your bag" }).click();
  await expect(
    page.getByRole("heading", { name: "Good to see you again." }),
  ).toBeVisible();
  await page.getByLabel("Email address").fill("preview@example.com");
  await page.getByLabel(/Password/).fill("password123");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Preview mode is read-only",
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Help me find it" }).click();
  await page
    .getByLabel("What are you looking for?")
    .fill("headphones under 3000");
  await page.getByRole("button", { name: "Find matches" }).click();
  await expect(
    page.getByText("Catalogue search · no AI provider connected"),
  ).toBeVisible();
  await expect(page.locator(".assistant-results a")).toHaveCount(1);
  await page.getByRole("button", { name: "Close shopping helper" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  expect(errors).toEqual([]);
});
test("invalid stored session does not crash the app", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("user", "not json"));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /A little more/ }),
  ).toBeVisible();
});
