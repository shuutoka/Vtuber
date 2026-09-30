const { chromium } = require("playwright");
const fs = require("fs"),
  path = require("path"),
  assert = require("assert");
const root = path.resolve(__dirname, "..");
const qaDir = process.env.QA_OUTPUT || path.resolve(root, "../vtuber-v2-qa");
fs.mkdirSync(qaDir, { recursive: true });
const mime = {
  ".html": "text/html",
  ".css": "text/css",
  ".mjs": "text/javascript",
  ".js": "text/javascript",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
};
const fixture = {
  version: 2,
  status: "ok",
  updatedAt: new Date().toISOString(),
  coverage: { scanned: 321, pages: 4, complete: true },
  users: {},
  streams: [],
  spotlightStreams: [],
};
for (let i = 0; i < 5; i++) {
  const login = `qa${i}`;
  fixture.users[login] = {
    displayName: `Test ${i}`,
    avatar: `https://qa.test/avatar/${i}`,
    description: "Présentation publique de test",
  };
  fixture.streams.push({
    login,
    name: `Test ${i}`,
    title: `Test ${i} <script>ne pas exécuter</script>`,
    category: i % 2 ? "Art" : "Jeu test",
    viewers: [4, 12, 60, 200, 800][i],
    thumbnail: `https://qa.test/preview/${i}`,
    tags: ["VTuber"],
  });
}
for (const [i, login] of [
  "ryllaka",
  "lulufaevt",
  "yuann_art",
  "nixy_vt",
].entries())
  fixture.users[login] = {
    displayName: login,
    avatar: `https://qa.test/avatar/${i}`,
    description: "Bio QA — données uniquement utilisées par le test",
  };
fixture.spotlightStreams = [
  { login: "ryllaka", title: "QA Spotlight", category: "Art", viewers: 42 },
];
const svg = (label) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#303d58"/><path d="M0 250 240 20 420 290 640 60" stroke="#b3a1df" fill="none" stroke-width="3"/><text x="320" y="195" fill="#d1c3f2" font-size="60" text-anchor="middle">${label}</text></svg>`;
async function intercept(page, useFixture) {
  await page.route("**/*", async (route) => {
    const u = new URL(route.request().url());
    if (u.hostname === "qa.test")
      return route.fulfill({
        contentType: "image/svg+xml",
        body: svg(u.pathname.split("/").pop()),
      });
    if (u.hostname !== "vtuber.test") return route.abort();
    let filename = path.resolve(
      root,
      "." + decodeURIComponent(u.pathname === "/" ? "/index.html" : u.pathname),
    );
    if (!filename.startsWith(root + path.sep))
      return route.fulfill({ status: 403, body: "Forbidden" });
    if (useFixture && u.pathname === "/data/live.json")
      return route.fulfill({
        contentType: "application/json",
        body: JSON.stringify(fixture),
      });
    if (fs.existsSync(filename) && fs.statSync(filename).isFile())
      return route.fulfill({
        contentType: mime[path.extname(filename)] || "application/octet-stream",
        body: fs.readFileSync(filename),
      });
    return route.fulfill({ status: 404, body: "Missing file" });
  });
}
(async () => {
  const browser = await chromium.launchPersistentContext(
    fs.mkdtempSync("/tmp/vtuber-browser-"),
    {
      executablePath: process.env.BROWSER_EXECUTABLE,
      headless: true,
      serviceWorkers: "block",
      args: ["--no-sandbox", "--no-zygote", "--single-process"],
    },
  );
  const failures = [];
  for (const width of [1440, 1024, 768, 390, 320]) {
    const page = await browser.newPage();
    await page.setViewportSize({ width, height: 960 });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await intercept(page, true);
    await page.goto("http://vtuber.test/", { waitUntil: "networkidle" });
    await page.locator(".spotlight-access").first().waitFor();
    assert.equal(await page.locator(".spotlight-access").count(), 4);
    assert.equal(await page.locator(".dock-link").count(), 4);
    for (const route of [
      "",
      "discover",
      "profile/ryllaka",
      "spotlight",
      "pro/ryllaka",
      "events",
      "archive",
      "about",
    ]) {
      await page.goto("http://vtuber.test/#/" + route);
      await page.waitForTimeout(320);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      );
      if (overflow) failures.push(`${width} overflow ${route || "home"}`);
      assert.equal(await page.locator(".dock-link").count(), 4);
    }
    await page.goto("http://vtuber.test/#/discover");
    await page.waitForTimeout(300);
    assert.equal(await page.locator(".channel").count(), 5);
    await page.locator("#viewers").selectOption("0-20");
    assert.equal(await page.locator(".channel").count(), 2);
    await page.locator("#category").selectOption("Art");
    assert.equal(await page.locator(".channel").count(), 1);
    await page.locator(".raid-trigger").click();
    await page.waitForTimeout(1450);
    assert.equal(await page.locator(".raid-result h3").innerText(), "Test 1");
    await page.locator(".dialog-close").click();
    await page.locator("#viewers").selectOption("");
    await page.locator("#category").selectOption("");
    await page.locator("#search").fill("Test 0");
    assert.equal(await page.locator(".channel").count(), 1);
    await page.locator("#search").fill("");
    await page.goto("http://vtuber.test/#/pro/ryllaka");
    await page.waitForTimeout(100);
    await page.locator("[name=sender]").fill("QA organisation");
    await page.locator("[name=email]").fill("qa@example.org");
    await page
      .locator("[name=message]")
      .fill("Une proposition de test avec une date et un budget.");
    await page.locator("#pro-form button[type=submit]").click();
    assert(
      (await page.locator("#pro-result").innerText()).includes(
        "Aucun message n’a été envoyé",
      ),
    );
    assert(
      (await page.locator("#proposal-text").inputValue()).includes(
        "qa@example.org",
      ),
    );
    await page.goto("http://vtuber.test/#/");
    await page.waitForTimeout(350);
    await page.screenshot({
      path: path.join(qaDir, `hub-${width}-fixture.png`),
      fullPage: true,
    });
    if (errors.length)
      failures.push(`${width} page errors ${errors.join(", ")}`);
    await page.close();
  }
  const real = await browser.newPage();
  await real.setViewportSize({ width: 1440, height: 1000 });
  await intercept(real, false);
  await real.goto("http://vtuber.test/", { waitUntil: "networkidle" });
  await real.screenshot({
    path: path.join(qaDir, "hub-real.png"),
    fullPage: true,
  });
  await real.setViewportSize({ width: 390, height: 844 });
  await real.screenshot({
    path: path.join(qaDir, "hub-real-mobile.png"),
    fullPage: true,
  });
  await real.close();
  const reduced = await browser.newPage();
  await reduced.setViewportSize({ width: 390, height: 844 });
  await reduced.emulateMedia({ reducedMotion: "reduce" });
  await intercept(reduced, true);
  await reduced.goto("http://vtuber.test/#/discover", {
    waitUntil: "networkidle",
  });
  await reduced.locator(".raid-trigger").click();
  assert.equal(await reduced.locator(".raid-result").count(), 1);
  await reduced.close();
  const savedDate = fixture.updatedAt;
  fixture.updatedAt = new Date(Date.now() - 50 * 60000).toISOString();
  const stale = await browser.newPage();
  await intercept(stale, true);
  await stale.goto("http://vtuber.test/#/discover", {
    waitUntil: "networkidle",
  });
  assert.equal(await stale.locator(".channel").count(), 0);
  assert.equal(await stale.locator(".dock-live").count(), 0);
  assert.equal(await stale.locator(".dock-link").count(), 4);
  await stale.locator(".raid-trigger").click();
  assert.equal(await stale.locator(".raid-result").count(), 0);
  await stale.close();
  fixture.updatedAt = savedDate;
  const missing = await browser.newPage();
  await intercept(missing, true);
  await missing.route("**/data/live.json", (route) =>
    route.fulfill({ status: 404, body: "Missing" }),
  );
  await missing.goto("http://vtuber.test/#/discover", {
    waitUntil: "networkidle",
  });
  assert.equal(await missing.locator(".dock-link").count(), 4);
  assert(
    (await missing.locator(".notice").innerText()).includes("inaccessibles"),
  );
  await missing.close();
  await browser.close();
  console.log(
    JSON.stringify(
      { testedWidths: [1440, 1024, 768, 390, 320], failures, output: qaDir },
      null,
      2,
    ),
  );
  assert.equal(failures.length, 0);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
