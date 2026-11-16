import assert from "node:assert/strict";
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { fileURLToPath } from "node:url";
import { createServer, loadEnv } from "vite";

const output = new URL("../dist/public/", import.meta.url);
const env = loadEnv("production", fileURLToPath(new URL("../", import.meta.url)), "VITE_");
function writePage(name, content) {
  const file = new URL(name, output);
  const temp = new URL(`${name}.tmp`, output);
  writeFileSync(temp, content);
  renameSync(temp, file);
}

function escapeHtml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

const server = await createServer({
  mode: "production",
  server: { middlewareMode: true },
  optimizeDeps: { noDiscovery: true, include: [] },
});

try {
  const { getMeasurementConfig } = await server.ssrLoadModule("/src/lib/measurement.ts");
  const measurement = getMeasurementConfig(env);
  const { default: Home } = await server.ssrLoadModule("/src/pages/Home.tsx");
  const file = new URL("index.html", output);
  const html = readFileSync(file, "utf8");
  const placeholder = '<div id="root"></div>';
  assert.ok(html.includes(placeholder), "Expected a single empty root for prerendering");
  const rendered = html.replace(placeholder, `<div id="root">${renderToString(createElement(Home))}</div>`);
  writePage("index.html", rendered);
  if (measurement) {
    const operator = escapeHtml(measurement.operator);
    const email = escapeHtml(measurement.email);
    const services = [];
    const policies = [];
    if (measurement.gaId) {
      services.push("Google Analytics measures visits");
      policies.push('<a href="https://policies.google.com/privacy">Google’s privacy policy</a>');
    }
    if (measurement.clarityId) {
      services.push("Microsoft Clarity records interactions");
      policies.push('<a href="https://privacy.microsoft.com/en-us/privacystatement">Microsoft’s privacy statement</a>');
    }
    const referralNotice = measurement.gaId ? "For Google Analytics, the site passes the referring website's origin, not its full path or query. " : "";
    const clarityNotice = measurement.clarityId ? "Clarity may process the page address and referrer as well as interaction data. " : "";
    const privacy = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, follow"><title>Privacy notice | D8D Tech</title></head>
<body><main style="max-width:44rem;margin:3rem auto;padding:0 1rem;font:1rem/1.6 system-ui">
<p><a href="/">Back to D8D Tech</a></p><h1>Privacy notice</h1>
<p>This pre-launch website is operated by ${operator}. Privacy enquiries: <a href="mailto:${encodeURIComponent(measurement.email)}">${email}</a>.</p>
<p>Without your consent, this site does not load its optional measurement services. If you opt in, ${services.join(" and ")}. Providers may process online identifiers, device and usage data. ${referralNotice}${clarityNotice}We do not use advertising tags.</p>
<p>We remember your choices in your browser's local storage for up to 180 days. If you opt into a service, it may set cookies. To change or withdraw consent, use <strong>Privacy settings</strong> on the homepage. Withdrawal stops optional scripts on the next page load and attempts to remove the site's measurement cookies. Your browser settings can also be used to remove stored data.</p>
<p>For provider details, data retention and international transfers, see ${policies.join(" and ")}. Contact us to ask about access, deletion or other data rights; you may also complain to the Irish Data Protection Commission.</p>
</main></body></html>`;
    writePage("privacy.html", privacy);
  }
} finally {
  await server.close();
}
