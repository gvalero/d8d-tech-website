# Discoverability and measurement

D8D Tech's website is an informational **pre-launch** page, not a trading business or product catalogue. Search engines and AI services decide independently whether to include, rank or cite it. These measures improve eligibility; they do not guarantee visibility.

## What is prepared

- The canonical homepage is `https://d8dtech.com/`. GitHub Pages serves the pre-rendered factual page, canonical, metadata and a sitemap without requiring JavaScript. The social card and minimal `WebSite` structured data use the same pre-launch facts; no products, stock, reviews or incorporated company are invented.
- `robots.txt` allows general crawlers including OpenAI's `OAI-SearchBot`, Anthropic's `Claude-SearchBot` and Bing's crawler. It deliberately blocks the separate training crawlers `GPTBot` and `ClaudeBot`. It also blocks `Google-Extended`, which affects Gemini grounding as well as certain AI training uses. That last restriction can reduce Gemini visibility. Do not silently change these owner-controlled choices merely to improve an SEO score. Robots rules are voluntary, not access controls.
- The site has optional public verification-token fields for Google and Bing, and optional consent-gated GA4 and Clarity slots. **No account, ID, token, visitor measurement or session recording is activated by the placeholders.** The sample `.env.example` contains no real values.
- A short optional `llms.txt` mirrors the homepage for tools that choose to read it. It is not a universally adopted standard and is not required for indexing; keep it current when business facts change. Prioritize accurate, accessible HTML. Neither schema nor an AI-specific file guarantees citation.

## Connect Search Console and Bing later

1. Sign in to [Google Search Console](https://search.google.com/search-console/) with the owner's Google account and check for an existing property before creating one. Prefer the **Domain** property `d8dtech.com`: Google provides a DNS TXT verification value, which must be added at the DNS provider. A Google Domain property cannot be verified by an HTML meta tag.
2. Alternatively, for the exact `https://d8dtech.com/` **URL-prefix property**, choose HTML-tag verification and add the provider-issued content value as the GitHub Actions variable `VITE_GOOGLE_SITE_VERIFICATION`. Rebuild and deploy, then complete verification in Search Console. The field is public and must not contain account credentials.
3. Submit `https://d8dtech.com/sitemap.xml`, inspect the homepage and request indexing if appropriate. Review indexing, page experience and Search Console's available AI-related reports. Google selects what to index; results and reports can take time or be unavailable at low volumes.
4. Sign in to [Bing Webmaster Tools](https://www.bing.com/webmasters/) and import the verified Google property where supported, or choose Bing's DNS or HTML verification. For HTML verification put the provider-issued `msvalidate.01` **content value** in the GitHub Actions variable `VITE_BING_SITE_VERIFICATION`, redeploy and complete verification. Submit the same sitemap. Check Bing's AI Performance report when available.
5. Optional verification variables must be plain provider-issued tokens containing letters, digits, hyphens or underscores. Leave them blank until issued. Both GitHub Actions workflows pass them to the production build; invalid values fail the build rather than publishing malformed tags. These values are public metadata, not passwords.

GitHub Actions variables are set under **Repository → Settings → Secrets and variables → Actions → Variables**. Permission to change them is required; if the connected GitHub integration cannot access repository variables, an owner or administrator must add them. Search-verification tokens are public metadata. Never put credentials or API secrets in Actions variables or source control.

## Enable optional analytics later

The checked-in `.env.production` contains the public GA4 and Clarity identifiers and the confirmed privacy identity/contact, but sets `VITE_MEASUREMENT_ENABLED=false`. Both GitHub Actions workflows now use that production config and do not allow repository variables to override the measurement gate. Thus the build sends **no Google Analytics or Microsoft Clarity requests** and displays no tracking banner. Do not change the gate until the privacy notice, provider terms/settings and consent checks have passed review. The existing code supports either provider independently or both together.

| Production build setting | Future value |
| --- | --- |
| `VITE_MEASUREMENT_ENABLED` | `true` only after the checks below; otherwise blank or `false` |
| `VITE_GA_ID` | Optional GA4 web stream Measurement ID such as `G-…` |
| `VITE_CLARITY_ID` | Optional Microsoft Clarity project ID |
| `VITE_PRIVACY_OPERATOR` | Owner-confirmed legal identity of the website's data controller |
| `VITE_PRIVACY_EMAIL` | Working email address for privacy requests |

1. Create or reuse a GA4 web stream in [Google Analytics](https://analytics.google.com/) and/or a Clarity site project in [Microsoft Clarity](https://clarity.microsoft.com/) for `https://d8dtech.com/`. Do not add duplicate dashboard snippets or connect Clarity to GA separately when using this integration.
2. Confirm the controller identity and working privacy contact, configure retention, sharing, international transfers and Clarity privacy/masking controls, then review the generated, source-linked `privacy.html` against the actual account contracts, recipient entities, transfer routes, cookie lifetimes and technical controls. The notice is not a legal certification. Where Clarity requires it, configure its Consent Mode and cookie settings.
3. Public IDs and privacy identity/contact are versioned in `.env.production`, not stored as secrets or repository variables. Keep `VITE_MEASUREMENT_ENABLED=false`. Only after review and passing checks should a separately reviewed code change enable it, followed by the normal protected `main` workflow. If enabled without a valid provider ID or privacy details, configuration fails closed.
4. Test a fresh session with browser network tools: no optional provider requests or cookies before opt-in or after **Reject all**; each individual choice loads only its selected service; withdrawal stops further requests and attempts to clear first-party cookies. Test expiry, browser privacy restrictions and multiple tabs. Check GA4 Realtime and Clarity after an opted-in visit. Check provider cookie settings and browser storage separately; no site code can promise deletion of every provider-controlled or third-party cookie.

Avoid sending names, email addresses, telephone numbers, sensitive URL parameters or AI prompts to analytics. For GA4, the site sends one homepage page-view and the external referring origin (not its path, query or fragment); it stores that origin for the opt-in reload only after analytics consent. The current GA4 property has two-month user/event retention with reset-on-activity off; Google Signals, user-provided data, enhanced measurement and Ads personalisation are off; email redaction is on; city/device reporting is on; URL query-parameter redaction is off. Enable that redaction or document the remaining risk before activation. The origin-only limitation does **not** apply to Clarity: it can read the page URL and referrer, including query parameters. The Clarity project uses Strict masking and masks page content/text, but that does not mask URL/referrer data. Microsoft's FAQ says URL-parameter masking can be requested, but it applies only to page URLs—not referrer URLs or clicked URLs—and parameter names are case-sensitive. Request/evaluate that control, avoid sensitive URLs, and review the actual settings before enabling. Microsoft's Consent Mode documentation says cookies may be set after valid consent; local testing observed Clarity's `_clck` (about one year) and `_clsk` (about one day) first-party cookies after opt-in. Confirm cookie behavior and expiry again for the live domain. A reload during first-time Clarity consent may lose the original referrer in some browsers. A privacy assessment may require additional controls. The recording choice is separate from the analytics choice.

### Current privacy review notes

- These settings were reviewed for the configured provider projects. Recheck before activation; a published notice must match the live account, current provider terms and actual cookie behavior.
- Google's published Analytics terms identify Google Ireland Limited for European controller data and describe transfer rules, including standard contractual clauses where required. The exact Google account agreement, role, onward recipients and transfer route have not been confirmed for this property; verify the accepted account terms before activation.
- Microsoft says EU Clarity customers contract with Microsoft Ireland Operations Limited; it stores data in Azure and describes standard contractual clauses between MIOL and Microsoft Corporation in the US. Clarity says recordings last 30 days, favorites/random samples up to nine months and heatmaps/labels up to nine months; per-user deletion requires deleting the entire project.
- The site's local consent tests do not prove live-domain reporting, provider-side consent recognition or provider-side erasure. Do not describe Clarity as cookie-free. The privacy notice and cookie settings still require controller/adviser review before a separate activation decision.

## What each tool can and cannot show

- **GA4** measures consenting human website sessions. In Traffic acquisition, review the available **AI Assistant** default channel, session source/medium, landing page and relevant outcomes. AI-assisted visits without a readable referrer may appear as Direct or another channel. Attribution rules, browser blocking and consent also affect counts. GA4 does not show every AI answer mentioning D8D.
- **Microsoft Clarity** can classify certain recognized AI-platform referrals and show opted-in visitor interactions. Its classifications do not cover every AI experience and are not proof of what was said to a user.
- **Search Console** measures Google Search visibility and its available AI-feature reporting. **Bing Webmaster Tools** offers a separate AI Performance view of selected citations and grounding queries. Neither shows all AI assistants or every mention.
- **Crawler activity is different from human referrals.** Meaningful bot-access reporting needs server/CDN request logs with user-agent and IP verification, access limits and retention controls. The current GitHub Pages setup does not provide this repository with a general raw request-log feed; Analytics and Clarity do not substitute for it. A future CDN/logging service would need a separate, privacy-conscious setup and might have costs.

## References

- [Google guidance for Search AI features](https://developers.google.com/search/docs/appearance/ai-features)
- [Google generative AI performance reporting](https://support.google.com/webmasters/answer/16984139?hl=en)
- [Google Analytics default channel groups](https://support.google.com/analytics/answer/9756891?hl=en)
- [OpenAI crawler controls](https://developers.openai.com/api/docs/bots)
- [Anthropic crawler controls](https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler)
- [Google crawler controls, including Google-Extended](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers)
- [Bing AI Performance](https://blogs.bing.com/webmaster/2026/2/Introducing-AI-Performance-in-Bing-Webmaster-Tools-Public-Preview/)
- [Microsoft Clarity AI channel groups](https://learn.microsoft.com/en-us/clarity/insights/ai-channel-group)
- [Irish DPC guidance on cookies and tracking](https://www.dataprotection.ie/en/dpc-guidance/guidance-cookies-and-other-tracking-technologies)
- [Irish DPC FAQ: consent for analytics cookies](https://www.dataprotection.ie/faqs/cookies/do-i-need-consent-analytics-cookies)
- [Irish DPC guidance on individual GDPR rights](https://www.dataprotection.ie/en/individuals/rights-individuals-under-general-data-protection-regulation)
- [Microsoft Clarity Consent Mode](https://learn.microsoft.com/en-us/clarity/setup-and-installation/consent-mode)
- [Microsoft Clarity cookies](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-cookies)
- [Microsoft Clarity masking](https://learn.microsoft.com/en-us/clarity/setup-and-installation/clarity-masking)
- [Microsoft Clarity FAQ](https://learn.microsoft.com/en-us/clarity/faq)
- [Google Analytics safeguarding data](https://support.google.com/analytics/answer/6004245?hl=en)
- [Google Analytics cookies](https://support.google.com/analytics/answer/11397207?hl=en)
- [Google Analytics retention](https://support.google.com/analytics/answer/7667196?hl=en)
- [Google Analytics data-processing terms](https://support.google.com/analytics/answer/3379636?hl=en)
- [Google measurement transfer terms](https://support.google.com/analytics/answer/9012600?hl=en)
