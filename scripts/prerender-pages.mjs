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
    const sections = [];
    const providerLinks = [];

    if (measurement.gaId) {
      providerLinks.push(
        '<li><a href="https://support.google.com/analytics/answer/6004245?hl=en">Google Analytics: safeguarding data and privacy</a></li>',
        '<li><a href="https://support.google.com/analytics/answer/11397207?hl=en">Google Analytics cookies</a></li>',
        '<li><a href="https://support.google.com/analytics/answer/7667196?hl=en">Google Analytics data retention</a></li>',
        '<li><a href="https://support.google.com/analytics/answer/3379636?hl=en">Google Analytics data-processing terms</a></li>',
        '<li><a href="https://support.google.com/analytics/answer/9012600?hl=en">Google measurement transfer terms</a></li>',
        '<li><a href="https://support.google.com/analytics/answer/7318509?hl=en">Google Analytics Privacy Disclosures Policy</a></li>',
        '<li><a href="https://policies.google.com/privacy">Google Privacy Policy</a></li>',
      );
      sections.push(`<section aria-labelledby="google-analytics">
<h2 id="google-analytics">Google Analytics 4</h2>
<p><strong>Purpose and data.</strong> If you separately choose Google Analytics, we use it to count visits and understand referral sources. The site sends a page-view for the homepage only, with the title “D8D Tech” and, when available, the referring website’s origin. The integration does not send the referring path, query string or fragment. Google may also process online identifiers, cookie information, usage events and technical information such as browser/device details and approximate location. We do not intentionally send names, email addresses, phone numbers, form entries or AI prompts through the site tag.</p>
<p><strong>Current account settings.</strong> User- and event-level retention is set to two months, with reset-on-new-activity off. Google Signals, user-provided data collection, enhanced measurement and advertising personalisation are off; email redaction is on. City-level location and device reporting are on, and GA4 URL query-parameter redaction is off. The site's fixed homepage URL and origin-only referrer limit what this integration sends, but do not replace provider-side redaction. Google's two-month retention setting applies to user- and event-level data, not standard aggregated reports.</p>
<p><strong>Cookies.</strong> Google's documented default first-party cookies are <code>_ga</code> and <code>_ga_&lt;container-id&gt;</code>, each with a default duration of up to two years. Browser restrictions or account settings can shorten this. Google does not receive data through this tag until you choose Google Analytics.</p>
<p><strong>Provider and transfers.</strong> Google receives the measurement data. Google's published Analytics terms describe different roles and transfer safeguards depending on the applicable agreement; the exact terms and onward-transfer route for an account depend on its account contract. Google identifies Google Ireland Limited for European controller data in its measurement terms and describes transfer rules, including standard contractual clauses where required. See the linked terms below for current details.</p>
</section>`);
    }

    if (measurement.clarityId) {
      providerLinks.push(
        '<li><a href="https://learn.microsoft.com/en-us/clarity/faq">Microsoft Clarity FAQ, retention and transfer information</a></li>',
        '<li><a href="https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-cookies">Microsoft Clarity cookies</a></li>',
        '<li><a href="https://learn.microsoft.com/en-us/clarity/setup-and-installation/consent-mode">Microsoft Clarity Consent Mode</a></li>',
        '<li><a href="https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-masking">Microsoft Clarity masking</a></li>',
        '<li><a href="https://learn.microsoft.com/en-us/clarity/setup-and-installation/privacy-disclosure">Microsoft Clarity sample disclosure wording</a></li>',
        '<li><a href="https://clarity.microsoft.com/terms">Microsoft Clarity Terms of Use</a></li>',
        '<li><a href="https://www.microsoft.com/privacy/privacystatement">Microsoft Privacy Statement</a></li>',
      );
      const clarityUrlNote = measurement.gaId
        ? "Unlike the Google Analytics integration, Clarity can process the full page URL and the referrer information available to the browser. This site does not strip query parameters; they may be exposed."
        : "Clarity can process the full page URL and the referrer information available to the browser. This site does not strip query parameters; they may be exposed.";
      sections.push(`<section aria-labelledby="microsoft-clarity">
<h2 id="microsoft-clarity">Microsoft Clarity</h2>
<p><strong>Purpose and data.</strong> If you opt in, we use Microsoft Clarity to see how visitors use and interact with this website, using behavioural metrics, heatmaps and session replays to improve usability. We do not use this integration to deliver advertising. Clarity can process the page address, referrer information available to the browser, interaction events and a pseudonymous browser identifier. ${clarityUrlNote} Do not put sensitive information in page URLs. Microsoft says URL-parameter masking can be requested, but it applies only to page URLs—not referrer URLs or clicked URLs—and parameter names are case-sensitive. We have not confirmed this control for the project; review the URL/referrer exposure and available controls before enabling Clarity.</p>
<p><strong>Masking.</strong> The Clarity project is set to Strict masking, which Microsoft describes as masking the entire page content; text masking is also enabled. This does not remove the page URL or referrer from collection. Masking changes are not retroactive, and Microsoft notes that some page material such as CSS may need separate consideration.</p>
<p><strong>Cookies.</strong> Microsoft's documentation identifies the first-party cookies <code>_clck</code> (a site-specific pseudonymous ID/preferences) and <code>_clsk</code> (which groups page views into a session recording). In our local browser check of the current project, the observed expiry was about one year for <code>_clck</code> and one day for <code>_clsk</code>; Microsoft may change these values. The Clarity project's Cookies switch is off to enable Consent Mode. Microsoft says this delays cookies until valid consent; it does not mean Clarity is cookie-free after opt-in. We observed Clarity cookies only after consent in the local test.</p>
<p><strong>Retention and deletion.</strong> Microsoft says Clarity recordings are retained for 30 days; favourite recordings and a random sample may be retained for up to nine months, and heatmaps and labels for up to nine months. Microsoft says deleting a specific user's Clarity data requires deleting the whole project. These are provider-stated periods and capabilities; they do not establish deletion of every provider backup or copy.</p>
<p><strong>Provider and transfers.</strong> Microsoft/Clarity receives interaction data and stores it in Microsoft Azure. Microsoft says EU Clarity customers contract with Microsoft Ireland Operations Limited and that standard contractual clauses govern transfers between that company and Microsoft Corporation in the United States. See Microsoft's current FAQ and terms below.</p>
</section>`);
    }

    const purposes = [
      measurement.gaId && "Google Analytics 4 measures visits and referral sources",
      measurement.clarityId && "Microsoft Clarity records interactions to help us understand site use and improve usability",
    ].filter(Boolean).join(" and ");
    const rejection = measurement.gaId && measurement.clarityId
      ? "You can reject either or both tools"
      : "You can reject the optional tool";
    const privacy = `<!doctype html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, follow"><title>Privacy notice | D8D Tech</title>
<style>body{max-width:48rem;margin:2rem auto;padding:0 1rem;color:#18212f;font:1rem/1.65 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}h1,h2{line-height:1.25}h1{font-size:2rem}h2{margin-top:2rem;font-size:1.35rem}a{color:#0759a5}li{margin:.45rem 0}.notice-box{padding:1rem;border-left:4px solid #285b9e;background:#f3f7fb}</style></head>
<body><main>
<p><a href="/">Back to D8D Tech</a></p><h1>Privacy notice</h1>
<p>This pre-launch website is operated by <strong>${operator}</strong>. For privacy questions or requests, email <a href="mailto:${encodeURIComponent(measurement.email)}">${email}</a>.</p>
<h2>What these optional tools do</h2>
<p>${purposes}. Each configured tool is optional and has a separate choice. Its code is held until you affirmatively opt in. ${rejection} without losing access to the website. We rely on your consent for this optional measurement. The Irish Data Protection Commission says consent is required for analytics cookies and similar tracking technologies.</p>
<h2>Your choices and cookies</h2>
<p>A cookie is a small text file stored in your browser; websites and services may use cookies or similar identifiers to remember preferences or understand site use. The provider sections below describe the cookies and identifiers used by each optional tool. Neither provider's code runs until you opt in.</p>
<p>Your choice is stored in first-party browser storage for up to 180 days. Your browser can block or clear cookies, but use <strong>Privacy settings</strong> on the homepage to change or withdraw this separately stored choice; clearing cookies alone does not erase provider-held data.</p>
${measurement.gaId ? "<p>If you choose Google Analytics, the referring website's origin is temporarily kept in session storage until the page-view is sent; the path, query string and fragment are not stored or sent through the Google Analytics integration.</p>" : ""}
<p>Withdrawal asks the providers to stop, removes their scripts where possible and attempts to clear measurement cookies accessible to this site. This is best-effort: it cannot recall information already sent, guarantee removal of provider-held data, or clear every cookie controlled by a provider. You can also clear this site's data in your browser. A request to delete data already held by a provider can be sent to us; we will consider it under applicable law and the provider's capabilities.</p>
${sections.join("\n")}
<h2>Recipients, international transfers and rights</h2>
<p>When you opt in, the selected provider receives the data described above and may process it through its group companies and service providers. Data may be processed outside Ireland or the European Economic Area under the terms and safeguards described in the relevant provider section and links below. Confirm the account-specific provider terms and transfer arrangements before activation.</p>
<p>You may ask us to provide access to, correct, erase or restrict your personal data, and exercise other rights available under the GDPR, including objection or portability where applicable. You may withdraw consent at any time; this does not affect processing that occurred before withdrawal. You may also complain to the <a href="https://www.dataprotection.ie/en/individuals/rights-individuals-under-general-data-protection-regulation">Irish Data Protection Commission</a>.</p>
<h2>Provider information</h2>
<ul>${providerLinks.join("\n")}
<li><a href="https://www.dataprotection.ie/faqs/cookies/do-i-need-consent-analytics-cookies">Irish Data Protection Commission: consent for analytics cookies</a></li>
<li><a href="https://www.dataprotection.ie/en/dpc-guidance/guidance-cookies-and-other-tracking-technologies">Irish Data Protection Commission: cookies and tracking technologies guidance</a></li>
<li><a href="https://www.dataprotection.ie/en/individuals/rights-individuals-under-general-data-protection-regulation">Irish Data Protection Commission: GDPR rights</a></li>
</ul>
<p class="notice-box"><strong>Scope.</strong> This notice describes the site code and provider settings reviewed for the optional services above. It is not a legal certification. Provider terms, settings and cookie behavior can change; D8D will recheck them before any separate decision to enable measurement.</p>
</main></body></html>`;
    writePage("privacy.html", privacy);
  }
} finally {
  await server.close();
}
