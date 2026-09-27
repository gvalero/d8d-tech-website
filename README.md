# D8D Tech — identity and local pre-launch website

> **Prototype status:** This repository contains a **local owner-review prototype**, not a public launch. D8D Tech is a proposed working name for Day Eight Devices. The identity, name, legal status, launch timing and contact details remain provisional.

## What is included

- An original **Dawn Loop** identity direction: D–8–D forms representing a quiet “next chapter” / renewal idea.
- Editable SVG source, full-colour / light / dark / one-colour variants, transparent PNGs and a favicon set.
- A responsive React + Vite pre-launch marketing page with clear used-phone resale, wholesale and retail positioning; it includes a non-collecting WhatsApp/email **contact pathway** that says contact details will follow at launch.
- No commerce, contact form, analytics, tracking, visitor-data collection or external image/font request.
- Brand guidance, a visual reference board and a record of asset provenance.

The visual direction is deliberately restrained: Apple-adjacent in its clarity, spacing and material simplicity, with only a subtle Day Eight / new-beginning resonance rather than overt religious symbolism.

## Local setup

**Requirements:** Node.js 22+ and pnpm 10+ (the project pins `pnpm@10.4.1` in `package.json`).

```bash
pnpm install
pnpm dev
```

Open the local URL printed by Vite (normally `http://localhost:3000`).

Other commands:

```bash
pnpm check     # TypeScript type check
pnpm build     # Production-style static build to dist/
pnpm preview   # Preview the built output
```

## Project map

| Location | Contents |
| --- | --- |
| `client/src/pages/Home.tsx` | Main accessible pre-launch page and factual copy. |
| `client/src/components/BrandMark.tsx` | Inline original wordmark/compact-mark component used in the page. |
| `client/src/index.css` | Responsive layout and reusable design tokens. |
| `client/index.html` | Provisional metadata with no-index posture; no guessed canonical URL or analytics. |
| `client/public/robots.txt` | Crawl deterrent for a future review build; not access control. |
| `brand/source/` | Editable primary and compact SVG vector sources. |
| `brand/exports/` | Practical logo SVG, transparent PNG and favicon exports. |
| `brand/preview/index.html` | Local visual reference board with light/dark and small-size mark presentation. |
| `brand/preview/website-desktop.png` | Representative desktop review screenshot. |
| `brand/preview/website-mobile.png` | Representative narrow-phone review screenshot. |
| `BRAND-GUIDELINES.md` | Positioning, voice, logo, palette, accessibility, type and component guidance. |
| `ASSET-LICENSES.md` | Original/external asset provenance and future-use rules. |
| `HANDOFF.md` | Original internal implementation brief; do not expose it in a public output. |

## Recommended direction and assets

The recommended direction is **Dawn Loop**. The teal figure-eight provides a continuous, restrained cue of renewal between two D forms, with a tightly kerned Tech lockup. The visual system uses Ink, Night, Paper, Mint and a minimal Gold focus detail.

Start with these files:

- `brand/source/d8d-tech-master.svg` — editable primary wordmark source.
- `brand/exports/d8d-tech-primary.svg` — preferred light-background wordmark.
- `brand/exports/d8d-tech-light-on-dark.svg` — dark-background wordmark.
- `brand/exports/d8d-tech-compact.svg` — compact D8D mark.
- `brand/exports/favicon.svg`, `favicon-16.png`, `favicon-32.png`, `apple-touch-icon-180.png`, `favicon.ico` — favicon set.
- `brand/preview/index.html` — presentation board; open locally in a browser.

## Implementation boundaries retained

- The website prominently states that the business is in preparation and is **not accepting orders, payments or devices**.
- The end-of-page contact pathway deliberately does not invent an email address or WhatsApp number, create a dead external link or collect a visitor message; it plainly states that those contact details will follow at launch.
- It does not invent a company number, legal name, registered address, email, delivery coverage, certification, supplier, inventory, warranty, environmental statistic or operating capacity.
- It does not include Product, Offer, review or fictional Organisation structured data.
- It does not use a domain name or canonical URL, and remains no-index by default.
- It uses CSS/vector artwork rather than external visual assets; see `ASSET-LICENSES.md`.

## Review before any public launch

Before publication, the owner must approve the final identity/name, resolve rights and company/trader status, decide accurate legal/contact/privacy disclosures and authorise a domain, hosting and public release. Any sales flow, waitlist, contact collection, payment capability or operational claim requires separate scope and factual review.

## Validation record

The following checks were completed on the local prototype:

- `pnpm check` — passed (TypeScript no-emit check).
- `pnpm build` — passed (Vite production build plus static server bundle).
- Responsive visual review — captured at 1440 px desktop and 390 px narrow-phone widths; see the two PNG files in `brand/preview/`.
- Keyboard review — the first Tab target is the visible Skip to content link; it has a 3 px Gold focus outline and activates `#main-content`.
- Navigation review — all on-page anchor targets resolve; primary and footer navigation use working anchors.
- Responsive menu review — the mobile-menu button toggles `aria-expanded` and its open state correctly.
- Browser console/request review — no console errors were observed; resource entries stayed on the local preview origin, with no external font, imagery, analytics or other runtime request. The page contains zero forms.
- Accessibility basics — semantic header/main/footer landmarks, labelled primary nav, descriptive logo labels, visible focus treatment, responsive reflow and a reduced-motion rule were checked. This is evidence of proportionate testing, **not** a claim of WCAG certification.

The site remains a local prototype; this README must not be read as a claim of public-production readiness.
