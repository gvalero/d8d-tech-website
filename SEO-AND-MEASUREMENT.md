# Discoverability and measurement

This is an indexable **pre-launch** page, not a trading business or product catalogue. Search engines and AI search products decide independently whether and when to include it. There is no guaranteed ranking or chatbot citation.

## Discoverability

- Canonical homepage: `https://d8dtech.com/`; `www` and the GitHub project URL redirect there. Add `.ie` only as a redirect after Cloudflare activates that zone.
- The build pre-renders the actual homepage into `index.html`, so crawlers and visitors without JavaScript see the factual content. The browser hydrates it for navigation and motion.
- `robots.txt` allows general crawlers (including AI search crawlers) and lists `sitemap.xml`. It blocks `GPTBot`, `ClaudeBot` and `Google-Extended` for model-training control. **Google-Extended also controls Gemini grounding**; blocking it can reduce appearance in Gemini answers, though Google Search indexing is unaffected. Robots rules are voluntary and do not stop non-compliant crawlers.
- No fabricated organisation, stock, offers, reviews or guarantees are marked up. A `llms.txt` file is not a substitute for crawlable, accurate HTML and is not needed for this one-page site.

## Search Console and Bing Webmaster Tools

1. In [Google Search Console](https://search.google.com/search-console/), add the **Domain** property `d8dtech.com`. Google gives a DNS TXT verification value. Add that TXT record to the Cloudflare `d8dtech.com` zone (no API credentials or login details in this repository) and complete verification. Do not create a second canonical site for `.ie`.
2. Submit `https://d8dtech.com/sitemap.xml`, inspect `https://d8dtech.com/`, and request indexing after the published page is crawlable. Watch Coverage/Indexing and Core Web Vitals; indexing is not instant.
3. In [Bing Webmaster Tools](https://www.bing.com/webmasters/), import the verified Google Search Console property, or verify the domain using Bing's DNS value. Submit the same sitemap. Bing indexing can feed Copilot search results. No third-party indexing service is required for a one-page site.
4. When new public pages are published, add their canonical URLs to the sitemap and give them distinct titles/descriptions and meaningful content. Avoid creating thin keyword or location pages to chase chatbot mentions.

## Optional analytics — disabled until owner completes setup

The default build sends **no requests** to Google Analytics or Clarity and displays no consent banner. Enabling measurement requires all of the following publicly visible GitHub Actions repository variables:

| Variable | Value |
| --- | --- |
| `VITE_GA_ID` | GA4 web data stream Measurement ID, beginning `G-` |
| `VITE_CLARITY_ID` | Clarity project ID |
| `VITE_PRIVACY_OPERATOR` | Owner-confirmed legal identity of the website's data controller |
| `VITE_PRIVACY_EMAIL` | Working email address for privacy requests |
| `VITE_MEASUREMENT_ENABLED` | `true` **only after** reviewing the generated privacy notice and provider settings |

1. Create a GA4 property and web data stream for `https://d8dtech.com/` in [Google Analytics](https://analytics.google.com/), and a site project for the same domain in [Microsoft Clarity](https://clarity.microsoft.com/). Choose appropriate retention, data-sharing and region settings and review both providers' data-processing terms. In Clarity **Settings → Setup**, disable default cookie-setting/enable Consent Mode. Do not install their dashboard snippets or connect Clarity to GA separately: this site loads each directly only after the relevant opt-in choice.
2. Provide a real controller identity and working privacy contact before switching on measurement. Have the generated `privacy.html` and vendor/transfer disclosures reviewed for the actual operator and chosen platform settings; it is a starting disclosure, not legal certification. Do not use a placeholder or an unmonitored address.
3. Set the four IDs/contact variables in **Repository Settings → Secrets and variables → Actions → Variables**, then set `VITE_MEASUREMENT_ENABLED=true` and redeploy `main` after review. Values are embedded in the public bundle; never use credentials or API secrets here.
4. Test a fresh visit: no Google or Clarity requests/cookies before consent or after **Reject all**; select each purpose separately and confirm only that provider loads; change **Privacy settings** to withdraw and check that first-party cookies are cleared. Check GA4 Realtime and Clarity after an opted-in test visit. Browser privacy blockers may block these scripts even with consent.

The opt-in choice is retained locally for at most 180 days. The consent banner offers reject, accept and granular choices. Withdrawal reloads the page without optional scripts; additional privacy rights requests use the configured email. If any required variable is missing or invalid while measurement is enabled, the build fails rather than publishing half-configured tracking.

## References

- [Google: JavaScript SEO and prerendering](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google: build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [OpenAI crawler controls](https://developers.openai.com/api/docs/bots)
- [Google crawler controls, including Google-Extended](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers)
- [Irish DPC cookie guidance](https://www.dataprotection.ie/en/dpc-guidance/guidance-cookies-and-other-tracking-technologies)
- [Microsoft Clarity Consent Mode](https://learn.microsoft.com/en-us/clarity/setup-and-installation/consent-mode)
