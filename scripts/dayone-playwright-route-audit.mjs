import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL || "http://localhost:3012";

const MANAGER = {
  email: "codex-manager@dayone.local",
  password: "CodexMgr!2026",
};

const DRIVER = {
  email: "codex-driver@dayone.local",
  password: "CodexDrv!2026",
};

const managerRoutes = [
  "/dayone",
  "/dayone/dispatch",
  "/dayone/purchase-receipts",
  "/dayone/inventory",
  "/dayone/ar",
  "/dayone/orders",
  "/dayone/drivers",
];

const driverRoutes = [
  "/driver",
  "/driver/today",
  "/driver/orders",
  "/driver/worklog",
  "/driver/profile",
];

async function loginManager(page) {
  await page.goto(`${BASE_URL}/dayone/login`, { waitUntil: "domcontentloaded" });
  await page.getByPlaceholder("name@company.com").fill(MANAGER.email);
  await page.getByPlaceholder("••••••••").fill(MANAGER.password);
  await page.getByRole("button", { name: "登入" }).click();
  await page.waitForURL(`${BASE_URL}/dayone`, { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState("networkidle").catch(() => {});
}

async function loginDriver(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.getByLabel("電子郵件").fill(DRIVER.email);
  await page.getByLabel("密碼").fill(DRIVER.password);
  await page.getByRole("button", { name: "登入" }).click();
  await page.waitForURL(/\/driver/, { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState("networkidle").catch(() => {});
}

async function auditRoutes(page, routes, tag) {
  const routeResults = [];

  for (const route of routes) {
    const pageErrors = [];
    const consoleErrors = [];
    const onConsole = (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    };
    const onPageError = (error) => {
      pageErrors.push(String(error));
    };

    page.on("console", onConsole);
    page.on("pageerror", onPageError);

    await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(800);

    const headings = (await page.locator("h1, h2, h3").allTextContents()).filter(Boolean);
    const bodyText = (await page.locator("body").innerText()).slice(0, 1200);

    routeResults.push({
      tag,
      route,
      finalUrl: page.url(),
      headings,
      consoleErrors,
      pageErrors,
      bodyPreview: bodyText,
    });

    page.off("console", onConsole);
    page.off("pageerror", onPageError);
  }

  return routeResults;
}

const browser = await chromium.launch({ headless: true });

try {
  const managerContext = await browser.newContext();
  const managerPage = await managerContext.newPage();
  await loginManager(managerPage);
  const managerResults = await auditRoutes(managerPage, managerRoutes, "manager");

  const driverContext = await browser.newContext();
  const driverPage = await driverContext.newPage();
  await loginDriver(driverPage);
  const driverResults = await auditRoutes(driverPage, driverRoutes, "driver");

  console.log(JSON.stringify([...managerResults, ...driverResults], null, 2));

  await managerContext.close();
  await driverContext.close();
} finally {
  await browser.close();
}
