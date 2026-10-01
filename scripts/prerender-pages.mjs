import assert from "node:assert/strict";
import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";

const output = new URL("../dist/public/", import.meta.url);
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
  const { default: Home } = await server.ssrLoadModule("/src/pages/Home.tsx");
  const file = new URL("index.html", output);
  const html = readFileSync(file, "utf8");
  const placeholder = '<div id="root"></div>';
  assert.ok(html.includes(placeholder), "Expected a single empty root for prerendering");
  const rendered = html.replace(placeholder, `<div id="root">${renderToString(createElement(Home))}</div>`);
  writePage("index.html", rendered);
  if (process.env.VITE_MEASUREMENT_ENABLED === "true") {
    const operator = escapeHtml(process.env.VITE_PRIVACY_OPERATOR);
    const email = escapeHtml(process.env.VITE_PRIVACY_EMAIL);
    const privacy = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, follow"><title>Privacy notice | D8D Tech</title></head>
<body><main style="max-width:44rem;margin:3rem auto;padding:0 1rem;font:1rem/1.6 system-ui">
<p><a href="/">Back to D8D Tech</a></p><h1>Privacy notice</h1>
<p>This pre-launch website is operated by ${operator}. Privacy enquiries: <a href="mailto:${encodeURIComponent(process.env.VITE_PRIVACY_EMAIL)}">${email}</a>.</p>
<p>Without consent, this site does not load Google Analytics or Microsoft Clarity. If you opt in, Google Analytics measures visits and Microsoft Clarity records interactions, depending on your separate choices. These providers may process online identifiers, device and usage data. We do not use advertising tags.</p>
<p>We remember your choices in your browser's local storage for up to 180 days. If you opt into a service, it may set its own cookies. To change or withdraw consent, use <strong>Privacy settings</strong> on the homepage. Withdrawal stops optional scripts on the next page load and clears the site's analytics/Clarity cookies.</p>
<p>For provider details, data retention and international transfers, see <a href="https://policies.google.com/privacy">Google's privacy policy</a> and <a href="https://privacy.microsoft.com/en-us/privacystatement">Microsoft's privacy statement</a>. Contact us to ask about access, deletion or other data rights; you may also complain to the Irish Data Protection Commission.</p>
</main></body></html>`;
    writePage("privacy.html", privacy);
  }
} finally {
  await server.close();
}
