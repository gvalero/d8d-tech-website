export type MeasurementConfig = {
  gaId?: string;
  clarityId?: string;
  operator: string;
  email: string;
};

type MeasurementEnvironment = {
  VITE_MEASUREMENT_ENABLED?: string;
  VITE_GA_ID?: string;
  VITE_CLARITY_ID?: string;
  VITE_PRIVACY_OPERATOR?: string;
  VITE_PRIVACY_EMAIL?: string;
};

export function getMeasurementConfig(env: MeasurementEnvironment): MeasurementConfig | null {
  if (env.VITE_MEASUREMENT_ENABLED !== "true") return null;

  // An absent/empty field means that provider is not configured, not that it may load.
  const gaId = env.VITE_GA_ID || undefined;
  const clarityId = env.VITE_CLARITY_ID || undefined;
  const operator = env.VITE_PRIVACY_OPERATOR?.trim();
  const email = env.VITE_PRIVACY_EMAIL;
  if ((!gaId && !clarityId) || (gaId && !/^G-[A-Z0-9]+$/.test(gaId)) ||
      (clarityId && !/^[a-z0-9]+$/.test(clarityId)) || !operator || !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Measurement requires at least one valid provider ID and a confirmed privacy operator and contact email");
  }
  return { gaId, clarityId, operator, email };
}

export const CONSENT_STORAGE_KEY = "d8d-measurement-consent";
export const CONSENT_BLOCK_KEY = "d8d-measurement-blocked";
export const REFERRAL_STORAGE_KEY = "d8d-accepted-referral-origin";
export const CONSENT_MAX_AGE = 180 * 24 * 60 * 60 * 1000;
// Increment whenever the provider purposes or visitor-facing disclosures materially change.
export const CONSENT_VERSION = 2;

export type MeasurementPreference = {
  analytics: boolean;
  recordings: boolean;
  savedAt: number;
  version: number;
  // Bind the choice to the IDs shown when it was made. A changed provider needs a new choice.
  providers: { gaId: string | null; clarityId: string | null };
  // A pending referral is usable only with the specific grant that created it.
  referralToken?: string;
};

type Clarity = ((...args: unknown[]) => void) & { q?: unknown[][] };
declare global {
  interface Window {
    dataLayer?: IArguments[];
    gtag?: (...args: unknown[]) => void;
    clarity?: Clarity;
  }
}

export function makePreference(config: MeasurementConfig, analytics: boolean, recordings: boolean, now = Date.now()): MeasurementPreference {
  return {
    analytics: !!config.gaId && analytics,
    recordings: !!config.clarityId && recordings,
    savedAt: now,
    version: CONSENT_VERSION,
    providers: { gaId: config.gaId ?? null, clarityId: config.clarityId ?? null },
  };
}

export function parsePreference(raw: string | null, config: MeasurementConfig, now = Date.now()): MeasurementPreference | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const p = value as Partial<MeasurementPreference>;
    if (typeof p.analytics !== "boolean" || typeof p.recordings !== "boolean" ||
        typeof p.savedAt !== "number" || !Number.isFinite(p.savedAt) ||
        p.version !== CONSENT_VERSION ||
        p.savedAt <= 0 || p.savedAt > now || now - p.savedAt >= CONSENT_MAX_AGE ||
        !p.providers || p.providers.gaId !== (config.gaId ?? null) ||
        p.providers.clarityId !== (config.clarityId ?? null) ||
        (p.analytics && !config.gaId) || (p.recordings && !config.clarityId)) return null;
    return p as MeasurementPreference;
  } catch {
    return null;
  }
}

type Providers = { analytics: boolean; recordings: boolean };
const ALL: Providers = { analytics: true, recordings: true };

/** Keep only a referring origin; never forward credentials, paths, queries or fragments. */
export function referralOrigin(referrer: string, ownOrigin: string): string {
  try {
    const url = new URL(referrer);
    if (!["https:", "http:"].includes(url.protocol) || url.username || url.password || url.origin === ownOrigin) return "";
    return `${url.origin}/`;
  } catch {
    return "";
  }
}

/** Best effort: JS can only see cookies available to this origin and current path. */
export function cookieDeletionStrings(cookieHeader: string, hostname: string, pathname: string, config: MeasurementConfig, providers: Providers): string[] {
  const names = new Set<string>();
  if (providers.analytics) {
    ["_ga", "_gid", "_gat"].forEach(name => names.add(name));
    if (config.gaId) names.add(`_ga_${config.gaId.slice(2)}`);
  }
  if (providers.recordings) ["_clck", "_clsk"].forEach(name => names.add(name));
  for (const cookie of cookieHeader.split(";")) {
    const name = cookie.trim().split("=")[0];
    if ((providers.analytics && /^_(?:ga|gid|gat)(?:_[A-Za-z0-9_]+)?$/.test(name)) ||
        (providers.recordings && (name === "_clck" || name === "_clsk"))) names.add(name);
  }
  const paths = new Set(["/"]);
  let path = "";
  for (const part of pathname.split("/").filter(Boolean)) {
    // Cookie attributes cannot safely express a semicolon or control character in a path.
    if (/[;\u0000-\u0020\u007f]/.test(part)) break;
    path += `/${part}`;
    paths.add(path);
    paths.add(`${path}/`);
  }
  // Do not try parent-domain suffixes for IP literals or single-label hosts.
  const host = hostname.toLowerCase().replace(/\.$/, "");
  const labels = host.split(".");
  const domains = new Set<string>();
  if (host && !host.includes(":") && !/^\d+(?:\.\d+){3}$/.test(host)) {
    for (let i = 0; i < labels.length - 1; i++) domains.add(labels.slice(i).join("."));
  }
  const result: string[] = [];
  for (const name of Array.from(names)) for (const cookiePath of Array.from(paths)) {
    result.push(`${name}=; Max-Age=0; Path=${cookiePath}; SameSite=Lax`);
    for (const domain of Array.from(domains)) result.push(`${name}=; Max-Age=0; Path=${cookiePath}; Domain=${domain}; SameSite=Lax`);
  }
  return result;
}

function clearPendingReferral(host: Window) {
  try { host.sessionStorage.removeItem(REFERRAL_STORAGE_KEY); } catch { /* Storage can be unavailable. */ }
}

function hasNewerPendingReferral(host: Window, config: MeasurementConfig, event: StorageEvent): boolean {
  try {
    const pending: unknown = JSON.parse(host.sessionStorage.getItem(REFERRAL_STORAGE_KEY) ?? "null");
    const token = pending && typeof pending === "object" ? (pending as { token?: unknown }).token : undefined;
    const current = parsePreference(host.localStorage.getItem(CONSENT_STORAGE_KEY), config);
    const previous = parsePreference(event.oldValue, config);
    return typeof token === "string" && !!current?.analytics && current.referralToken === token && previous?.referralToken !== token;
  } catch { return false; }
}

function stopMeasurement(host: Window, doc: Document, config: MeasurementConfig, providers: Providers) {
  if (providers.analytics) {
    if (config.gaId) (host as unknown as Record<string, unknown>)[`ga-disable-${config.gaId}`] = true;
    try {
      host.gtag?.("consent", "update", { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    } catch { /* Continue cleanup if a provider API fails. */ }
  }
  if (providers.recordings) {
    try {
      host.clarity?.("consentv2", { ad_Storage: "denied", analytics_Storage: "denied" });
      host.clarity?.("consent", false);
    } catch { /* Continue cleanup if a provider API fails. */ }
  }
  for (const [provider, shouldStop] of [["ga", providers.analytics], ["clarity", providers.recordings]] as const) {
    if (shouldStop) doc.querySelectorAll(`script[data-d8d-measurement="${provider}"]`).forEach(script => script.remove());
  }
  try {
    for (const expiration of cookieDeletionStrings(doc.cookie, host.location.hostname, host.location.pathname, config, providers)) {
      try { doc.cookie = expiration; } catch { /* Cookies may be blocked by the browser. */ }
    }
  } catch { /* Cookie access itself can be blocked. */ }
}

function loadMeasurement(host: Window, doc: Document, preference: MeasurementPreference, config: MeasurementConfig) {
  if (preference.analytics && config.gaId && !doc.querySelector('script[data-d8d-measurement="ga"]')) {
    (host as unknown as Record<string, unknown>)[`ga-disable-${config.gaId}`] = false;
    host.dataLayer = host.dataLayer || [];
    // The Google tag recognizes gtag commands as Arguments objects, not plain arrays.
    host.gtag = function () { host.dataLayer!.push(arguments); };
    host.gtag("consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    host.gtag("js", new Date());
    // Consent may have reloaded the page; recover the origin captured at the time of opt-in.
    // No referral value is stored before analytics consent. Paths and query strings are never sent.
    let pageReferrer = referralOrigin(doc.referrer, host.location.origin);
    try {
      const savedReferrer = host.sessionStorage.getItem(REFERRAL_STORAGE_KEY);
      if (savedReferrer !== null) {
        // A stale or unreadable pending referral must not fall back to the old document referrer.
        pageReferrer = "";
        host.sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
        const pending: unknown = JSON.parse(savedReferrer);
        if (pending && typeof pending === "object") {
          const { origin, token } = pending as { origin?: unknown; token?: unknown };
          if (typeof origin === "string" && typeof token === "string" && token === preference.referralToken) {
            pageReferrer = referralOrigin(origin, host.location.origin);
          }
        }
      }
    } catch { /* A missing referral is preferable to collecting extra data. */ }
    host.gtag("config", config.gaId, {
      send_page_view: false, page_location: `${host.location.origin}/`, page_referrer: pageReferrer,
      allow_google_signals: false, allow_ad_personalization_signals: false,
    });
    host.gtag("event", "page_view", { page_location: `${host.location.origin}/`, page_referrer: pageReferrer, page_title: "D8D Tech" });
    const script = doc.createElement("script");
    script.dataset.d8dMeasurement = "ga";
    script.async = true;
    script.referrerPolicy = "no-referrer";
    script.src = `https://www.googletagmanager.com/gtag/js?id=${config.gaId}`;
    doc.head.append(script);
  }
  if (preference.recordings && config.clarityId && !doc.querySelector('script[data-d8d-measurement="clarity"]')) {
    const clarity: Clarity = (...args) => { (clarity.q ??= []).push(args); };
    host.clarity = clarity;
    clarity("consentv2", { ad_Storage: "denied", analytics_Storage: "granted" });
    const script = doc.createElement("script");
    script.dataset.d8dMeasurement = "clarity";
    script.async = true;
    script.referrerPolicy = "no-referrer";
    script.src = `https://www.clarity.ms/tag/${config.clarityId}`;
    doc.head.append(script);
  }
}

export type ConsentState = { preference: MeasurementPreference | null; error: boolean };

/** Owns the page lifecycle; provider scripts are never loaded before a valid saved opt-in. */
export class MeasurementConsentController {
  private current: MeasurementPreference | null = null;
  private active: Providers = { analytics: false, recordings: false };
  // Removing script elements or resetting active cannot unload code already run in this document.
  private providerCodeMayBeResident = false;
  private timer: number | undefined;
  private channel: BroadcastChannel | undefined;
  private blockedUntilSave = false;
  private disposed = false;

  constructor(private config: MeasurementConfig, private onChange: (state: ConsentState) => void,
              private host: Window = window, private doc: Document = document) {}

  start() {
    this.host.addEventListener("storage", this.onStorage);
    this.host.addEventListener("focus", this.sync);
    this.host.addEventListener("pageshow", this.sync);
    this.doc.addEventListener("visibilitychange", this.sync);
    try {
      const Channel = (this.host as Window & typeof globalThis).BroadcastChannel;
      if (typeof Channel === "function") {
        const channel = new Channel(CONSENT_STORAGE_KEY);
        channel.onmessage = this.onBroadcast;
        this.channel = channel;
      }
    } catch { /* Storage events remain available where supported. */ }
    this.sync();
  }

  dispose() {
    this.disposed = true;
    this.host.removeEventListener("storage", this.onStorage);
    this.host.removeEventListener("focus", this.sync);
    this.host.removeEventListener("pageshow", this.sync);
    this.doc.removeEventListener("visibilitychange", this.sync);
    if (this.timer !== undefined) this.host.clearTimeout(this.timer);
    this.channel?.close();
  }

  private block(): boolean {
    try { this.host.sessionStorage.setItem(CONSENT_BLOCK_KEY, "1"); return true; } catch { return false; }
  }

  private announceWithdrawal() {
    try { this.channel?.postMessage("withdraw"); } catch { /* Best effort across tabs. */ }
  }

  private onBroadcast = (event: MessageEvent) => {
    if (event.data !== "withdraw") return;
    // A failed storage write elsewhere cannot be trusted to have updated our stored grant.
    const hadResident = this.providerCodeMayBeResident;
    this.blockedUntilSave = true;
    const guarded = this.block();
    clearPendingReferral(this.host);
    stopMeasurement(this.host, this.doc, this.config, ALL);
    this.active = { analytics: false, recordings: false };
    this.current = null;
    if (this.timer !== undefined) this.host.clearTimeout(this.timer);
    this.onChange({ preference: null, error: true });
    if (hadResident && guarded) this.host.location.reload();
  };

  private onStorage = (event: StorageEvent) => {
    if (event.key === CONSENT_STORAGE_KEY || event.key === null) {
      // Process a delayed withdrawal, but keep a pending referral belonging to a genuinely newer grant.
      if ((event.key === null || !parsePreference(event.newValue, this.config)?.analytics) &&
          !hasNewerPendingReferral(this.host, this.config, event)) clearPendingReferral(this.host);
      this.sync();
    }
  };

  private schedule(preference: MeasurementPreference) {
    if (this.timer !== undefined) this.host.clearTimeout(this.timer);
    const remaining = preference.savedAt + CONSENT_MAX_AGE - Date.now();
    // Periodic rechecks also limit the impact of system-clock changes while a tab stays open.
    this.timer = this.host.setTimeout(this.sync, Math.max(0, Math.min(remaining, 60 * 60 * 1000)));
  }

  private sync = () => {
    if (this.disposed) return;
    let raw: string | null = null;
    let unavailable = false;
    try {
      if (this.blockedUntilSave || this.host.sessionStorage.getItem(CONSENT_BLOCK_KEY)) unavailable = true;
      else raw = this.host.localStorage.getItem(CONSENT_STORAGE_KEY);
    } catch { unavailable = true; }
    const next = unavailable ? null : parsePreference(raw, this.config);
    if (!next) {
      const hadResident = this.providerCodeMayBeResident;
      clearPendingReferral(this.host);
      let safeToReload = false;
      let removeFailed = false;
      if (raw !== null) {
        try { this.host.localStorage.removeItem(CONSENT_STORAGE_KEY); safeToReload = true; } catch { removeFailed = true; }
      } else if (!unavailable) safeToReload = true;
      if (unavailable || removeFailed) {
        this.blockedUntilSave = true;
        safeToReload = this.block();
      }
      stopMeasurement(this.host, this.doc, this.config, ALL);
      this.active = { analytics: false, recordings: false };
      this.current = null;
      if (this.timer !== undefined) this.host.clearTimeout(this.timer);
      this.onChange({ preference: null, error: unavailable || removeFailed });
      if (hadResident) {
        if (unavailable || removeFailed) this.announceWithdrawal();
        if (safeToReload) this.host.location.reload();
      }
      return;
    }
    if (!next.analytics) clearPendingReferral(this.host);
    if (this.providerCodeMayBeResident && !this.current) {
      // A failed withdrawal reset our state, not the vendor code. Never report a
      // successful recovery in this document while a safe reload is still pending.
      stopMeasurement(this.host, this.doc, this.config, ALL);
      this.onChange({ preference: null, error: true });
      this.host.location.reload();
      return;
    }
    if (this.current && JSON.stringify(this.current) !== JSON.stringify(next)) {
      // Existing loaded code cannot be reliably unloaded by removing a script element.
      stopMeasurement(this.host, this.doc, this.config, { analytics: !next.analytics, recordings: !next.recordings });
      this.host.location.reload();
      return;
    }
    this.current = next;
    this.onChange({ preference: next, error: false });
    if (!next.analytics || !next.recordings) {
      stopMeasurement(this.host, this.doc, this.config, { analytics: !next.analytics, recordings: !next.recordings });
    }
    if (next.analytics || next.recordings) this.providerCodeMayBeResident = true;
    loadMeasurement(this.host, this.doc, next, this.config);
    this.active = { analytics: next.analytics, recordings: next.recordings };
    this.schedule(next);
  };

  save(analytics: boolean, recordings: boolean) {
    const preference = makePreference(this.config, analytics, recordings);
    const hadResident = this.providerCodeMayBeResident;
    const captureReferral = preference.analytics && !this.active.analytics;
    if (captureReferral) {
      // Without a unique token, discard the pending referral rather than risk reusing it for a later grant.
      try { preference.referralToken = this.host.crypto?.randomUUID?.(); } catch { /* The first opt-in still has its document referrer. */ }
    } else if (!preference.analytics) clearPendingReferral(this.host);
    // Rejection and withdrawal take effect even if persisting the choice fails.
    stopMeasurement(this.host, this.doc, this.config, { analytics: !preference.analytics, recordings: !preference.recordings });
    try {
      this.host.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(preference));
      // Save the origin only after an affirmative analytics choice, until the page-view is queued.
      if (captureReferral && preference.referralToken) {
        this.host.sessionStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify({
          origin: referralOrigin(this.doc.referrer, this.host.location.origin), token: preference.referralToken,
        }));
      } else if (captureReferral) {
        this.host.sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
      } else if (!preference.analytics) {
        this.host.sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
      }
      this.host.sessionStorage.removeItem(CONSENT_BLOCK_KEY);
      this.blockedUntilSave = false;
      if (hadResident) {
        // Running vendor code cannot be reliably unloaded in the current document.
        this.host.location.reload();
      } else {
        // First opt-in needs no reload; retain the original external referrer.
        this.current = null;
        this.sync();
      }
    } catch {
      this.blockedUntilSave = true;
      clearPendingReferral(this.host);
      stopMeasurement(this.host, this.doc, this.config, ALL);
      this.active = { analytics: false, recordings: false };
      this.current = null;
      if (this.timer !== undefined) this.host.clearTimeout(this.timer);
      const guarded = this.block();
      let removed = false;
      try { this.host.localStorage.removeItem(CONSENT_STORAGE_KEY); removed = true; } catch { /* Previous choice might remain. */ }
      this.announceWithdrawal();
      this.onChange({ preference: null, error: true });
      if (this.providerCodeMayBeResident && (guarded || removed)) this.host.location.reload();
    }
  }
}
