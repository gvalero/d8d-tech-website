import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";

const env = loadEnv("production", fileURLToPath(new URL("../", import.meta.url)), "VITE_");
const html = readFileSync(new URL("../dist/public/index.html", import.meta.url), "utf8");

assert.match(html, /src="\/assets\/[^"]+\.js"/, "Pages JavaScript must load from the custom domain root");
assert.match(html, /href="\/assets\/[^"]+\.css"/, "Pages CSS must load from the custom domain root");
assert.doesNotMatch(html, /(?:src|href)="\/d8d-tech-website\//, "Project-path assets break the custom domain");
assert.match(html, /<div id="root"><div class="site-shell">/, "Home content must be visible to crawlers without JavaScript");
assert.match(html, /<h1[^>]*>A sharper standard/, "The pre-launch homepage must have a crawlable heading");
assert.match(html, /<a class="contact-channel" href="mailto:info@d8dtech\.com">/, "The email contact must open a message to the public info address");
assert.doesNotMatch(html, /launching soon|email contact details will be announced|Contact and ordering information will be announced/i, "Remove stale launch and email placeholders");
assert.match(html, /not currently accepting orders, payments or devices/, "Contact availability must not imply commerce is open");
assert.match(html, /rel="canonical" href="https:\/\/d8dtech\.com\/"/);
assert.doesNotMatch(html, /noindex|manus-runtime/, "The public page must not be blocked or include debug runtime");
assert.match(html, /property="og:image" content="https:\/\/d8dtech\.com\/social-preview\.png"/);
assert.match(html, /name="twitter:card" content="summary_large_image"/);
assert.ok(existsSync(new URL("../dist/public/social-preview.png", import.meta.url)), "The social preview image must be published");
const structuredData = html.match(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/);
assert.ok(structuredData, "The homepage must include factual WebSite structured data");
const website = JSON.parse(structuredData[1]);
assert.equal(website["@type"], "WebSite");
assert.equal(website.url, "https://d8dtech.com/");
for (const [variable, name] of [["VITE_GOOGLE_SITE_VERIFICATION", "google-site-verification"], ["VITE_BING_SITE_VERIFICATION", "msvalidate.01"]]) {
  const token = env[variable]?.trim();
  if (token) {
    assert.ok(html.includes(`name="${name}" content="${token}"`), `${name} must contain the configured verification token`);
  } else {
    assert.ok(!html.includes(`name="${name}"`), `${name} must not contain a fake placeholder`);
  }
}
assert.ok(Buffer.byteLength(html) < 70_000, "The HTML document should stay below 70 kB uncompressed");

const robots = readFileSync(new URL("../dist/public/robots.txt", import.meta.url), "utf8");
assert.match(robots, /Sitemap: https:\/\/d8dtech\.com\/sitemap\.xml/);
assert.match(robots, /User-agent: \*\s+Allow: \//, "The public site must be crawlable");
assert.match(robots, /User-agent: GPTBot\s+Disallow: \//);
assert.match(robots, /User-agent: Google-Extended\s+Disallow: \//);
const sitemap = readFileSync(new URL("../dist/public/sitemap.xml", import.meta.url), "utf8");
assert.match(sitemap, /<loc>https:\/\/d8dtech\.com\/<\/loc>/);
const aiSummary = readFileSync(new URL("../dist/public/llms.txt", import.meta.url), "utf8");
assert.match(aiSummary, /not currently accepting orders, payments or devices/i);
assert.match(aiSummary, /https:\/\/d8dtech\.com\//);
const privacyPage = new URL("../dist/public/privacy.html", import.meta.url);
if (env.VITE_MEASUREMENT_ENABLED === "true") {
  assert.ok(existsSync(privacyPage), "Measurement requires a privacy notice");
  const privacy = readFileSync(privacyPage, "utf8");
  assert.match(privacy, /D8D TECH LIMITED/);
  assert.match(privacy, /gianpaolo@d8dtech\.com/);
  assert.match(privacy, /separate choice/);
  if (env.VITE_GA_ID) {
    assert.match(privacy, /Google Analytics 4/);
    assert.match(privacy, /referring website's origin/);
    assert.match(privacy, /two months/);
    assert.match(privacy, /two years/);
    assert.match(privacy, /support\.google\.com\/analytics\/answer\/7667196/);
    assert.match(privacy, /support\.google\.com\/analytics\/answer\/7318509/);
  }
  if (env.VITE_CLARITY_ID) {
    assert.match(privacy, /Microsoft Clarity/);
    assert.match(privacy, /page address, referrer information available to the browser, interaction events/);
    assert.match(privacy, /referrer URLs or clicked URLs/);
    assert.match(privacy, /behavioural metrics, heatmaps and session replays/);
    assert.match(privacy, /_clck/);
    assert.match(privacy, /_clsk/);
    assert.match(privacy, /30 days/);
    assert.match(privacy, /nine months/);
    assert.match(privacy, /learn\.microsoft\.com\/en-us\/clarity\/faq/);
    assert.match(privacy, /learn\.microsoft\.com\/en-us\/clarity\/setup-and-installation\/privacy-disclosure/);
  }
  assert.match(privacy, /standard contractual clauses/);
  assert.match(privacy, /Irish Data Protection Commission/);
  assert.match(privacy, /dataprotection\.ie\/faqs\/cookies/);
} else {
  assert.ok(!existsSync(privacyPage), "Do not publish a placeholder privacy notice");
  assert.doesNotMatch(html, /googletagmanager\.com|clarity\.ms/, "Tracking must not load by default");
}
