require("dotenv").config();

const fs = require("fs/promises");
const path = require("path");
const AdmZip = require("adm-zip");
const { chromium } = require("playwright");

async function scraper({ username, password, dateFrom, dateTo }) {
  const ENVIRONMENT = process.env.ENVIRONMENT || "PROD";

  console.log(`Running in: ${ENVIRONMENT}`);
  console.log(username, password, dateFrom, dateTo);

  if (!username || !password) {
    const message = "ERROR: Must provide username and password";
    console.log(message);
    return { status: "error", message };
  }

  const browser = await chromium.launch({
    headless: ENVIRONMENT === "PROD",
  }); // headless on the server

  const context = await browser.newContext({ acceptDownloads: true });

  context.setDefaultTimeout(60_000);

  const page = await context.newPage();

  // —— 1. Login ————————————————————————————————
  await page.goto("https://duquesnelight.com/");
  await page.getByRole("link", { name: "Log In" }).click();
  await page.waitForSelector('input[formcontrolname="username"]');
  await page.fill('input[formcontrolname="username"]', username);
  await page.fill('input[formcontrolname="password"]', password);

  await page.click('button[type="submit"], input[type="submit"]');

  /* ------------------------------------------------------------------
   Combined guard: wait for either success, error message, or timeout
------------------------------------------------------------------ */
  const seenLogout = page
    .waitForSelector("#nav-logout-link", { state: "visible" })
    .then(() => "success");

  const seenError = page
    .waitForSelector("p.error-message", { state: "visible" })
    .then(() => "error");

  // const timeout = page.waitForTimeout(15_000).then(() => "timeout");

  const loginResult = await Promise.race([seenLogout, seenError]);

  if (loginResult !== "success") {
    const message =
      loginResult === "error"
        ? "ERROR: Invalid username or password."
        : "ERROR: Login timed out — site may be unavailable.";
    console.log(message);
    await browser.close();
    return { status: "error", message };
  }

  console.log("1. Log in - SUCCESS");

  if (!dateFrom || !dateTo) {
    const message = `User logged in: ${username}`;
    console.log(message);
    await browser.close();
    return { status: "success", message };
  }

  await page.goto("https://duquesnelight.com/account-billing/account-summary");

  console.log("2. Navigated to Account Summary page");

  // —— 2. Navigate to “My Electric Use” and open export dialog —
  await page.getByRole("link", { name: /My Electric Use/i }).click();
  await page.waitForLoadState("networkidle");
  await page.waitForSelector(".green-button");
  await page.click(".green-button");

  console.log("3. Find Green Button - SUCCESS");

  // —— 3. Pick the date range and trigger the download ——
  await page.click('label[for="period-date"]');
  await page.waitForSelector("input#period-date:checked", { timeout: 5000 });

  // —— 4. Fill in From and To dates with focus + confirmation
  await page.waitForSelector("#date-selector--select-date-from", {
    timeout: 10000,
  });
  await page.waitForSelector("#date-selector--select-date-to", {
    timeout: 10000,
  });

  const fromInput = page.locator("#date-selector--select-date-from");
  const toInput = page.locator("#date-selector--select-date-to");

  await fromInput.click({ clickCount: 3 });
  await page.keyboard.press("Backspace");
  await fromInput.fill(dateFrom);

  await toInput.click({ clickCount: 3 });
  await page.keyboard.press("Backspace");
  await toInput.fill(dateTo);
  await page.keyboard.press("Tab"); // blur the input

  console.log("4. Fill in dates - SUCCESS");

  // —— 5. Fill in From and To dates with focus + confirmationWait for Export button to be enabled, then click and wait for download
  const exportButton = page.getByRole("button", { name: "Export" });
  await exportButton.waitFor({ state: "visible", timeout: 5000 });

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    exportButton.click(),
  ]);

  console.log("5. Click download button - SUCCESS");

  // Wait until Playwright finishes downloading
  const filePath = await download.path();
  if (!filePath) throw new Error("Download failed or file path not available");

  // Then save to desired location
  const tmpZip = path.join(process.cwd(), "tmp-export.zip");

  await download.saveAs(tmpZip);
  await browser.close();

  console.log("6. Save data - SUCCESS");

  // —— 6. Extract the CSV from the ZIP ————————————
  const zip = new AdmZip(tmpZip);
  const entry = zip.getEntries().find((e) => e.entryName.endsWith(".csv"));
  if (!entry) throw new Error("CSV not found in export");
  const data = zip.readAsText(entry);
  await fs.unlink(tmpZip); // tidy up

  console.log(`7. Returning data`);

  return { status: "success", data };
}

module.exports = { scraper };
