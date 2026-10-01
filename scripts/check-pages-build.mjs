import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const html = readFileSync(new URL("../dist/public/index.html", import.meta.url), "utf8");

assert.match(html, /src="\/assets\/[^"]+\.js"/, "Pages JavaScript must load from the custom domain root");
assert.match(html, /href="\/assets\/[^"]+\.css"/, "Pages CSS must load from the custom domain root");
assert.doesNotMatch(html, /(?:src|href)="\/d8d-tech-website\//, "Project-path assets break the custom domain");
assert.match(html, /<div id="root"><div class="site-shell">/, "Home content must be visible to crawlers without JavaScript");
assert.match(html, /<h1[^>]*>A sharper standard/, "The pre-launch homepage must have a crawlable heading");
assert.match(html, /rel="canonical" href="https:\/\/d8dtech\.com\/"/);
assert.doesNotMatch(html, /noindex|manus-runtime/, "The public page must not be blocked or include debug runtime");
assert.ok(Buffer.byteLength(html) < 70_000, "The HTML document should stay below 70 kB uncompressed");

const robots = readFileSync(new URL("../dist/public/robots.txt", import.meta.url), "utf8");
assert.match(robots, /Sitemap: https:\/\/d8dtech\.com\/sitemap\.xml/);
assert.match(robots, /User-agent: \*\s+Allow: \//, "The public site must be crawlable");
assert.match(robots, /User-agent: GPTBot\s+Disallow: \//);
assert.match(robots, /User-agent: Google-Extended\s+Disallow: \//);
const sitemap = readFileSync(new URL("../dist/public/sitemap.xml", import.meta.url), "utf8");
assert.match(sitemap, /<loc>https:\/\/d8dtech\.com\/<\/loc>/);
const privacyPage = new URL("../dist/public/privacy.html", import.meta.url);
if (process.env.VITE_MEASUREMENT_ENABLED === "true") {
  assert.ok(existsSync(privacyPage), "Measurement requires a privacy notice");
  assert.match(readFileSync(privacyPage, "utf8"), /Privacy enquiries:/);
} else {
  assert.ok(!existsSync(privacyPage), "Do not publish a placeholder privacy notice");
  assert.doesNotMatch(html, /googletagmanager\.com|clarity\.ms/, "Tracking must not load by default");
}
