import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL || "http://localhost:3012";

const accounts = [
  {
    name: "manager",
    loginPath: "/dayone/login",
    landingPath: "/dayone",
    email: "codex-manager@dayone.local",
    password: "CodexMgr!2026",
  },
  {
    name: "driver",
    loginPath: "/login",
    landingPath: "/driver",
    email: "codex-driver@dayone.local",
    password: "CodexDrv!2026",
  },
];

async function loginAndReport(browser, account) {
  const context = await browser.newContext();
  const page = await context.newPage();

  const result = {
    account: account.name,
    loginUrl: `${BASE_URL}${account.loginPath}`,
    finalUrl: null,
    cookieNames: [],
    pageHeadings: [],
    pageErrors: [],
    loginOk: false,
  };

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      result.pageErrors.push(msg.text());
    }
  });

  page.on("pageerror", (error) => {
    result.pageErrors.push(String(error));
  });

  await page.goto(result.loginUrl, { waitUntil: "domcontentloaded" });

  if (account.loginPath === "/dayone/login") {
    await page.getByPlaceholder("name@company.com").fill(account.email);
    await page.getByPlaceholder("••••••••").fill(account.password);
    await page.getByRole("button", { name: "登入" }).click();
  } else {
    await page.getByLabel("電子郵件").fill(account.email);
    await page.getByLabel("密碼").fill(account.password);
    await page.getByRole("button", { name: "登入" }).click();
  }

  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(1500);

  result.finalUrl = page.url();
  result.cookieNames = (await context.cookies()).map((cookie) => cookie.name);
  result.pageHeadings = await page.locator("h1, h2, h3").allTextContents();
  result.loginOk = result.finalUrl.includes(account.landingPath);

  await page.screenshot({
    path: `playwright-${account.name}.png`,
    fullPage: true,
  });

  await context.close();
  return result;
}

const browser = await chromium.launch({ headless: true });

try {
  const results = [];
  for (const account of accounts) {
    results.push(await loginAndReport(browser, account));
  }
  console.log(JSON.stringify(results, null, 2));
} finally {
  await browser.close();
}
