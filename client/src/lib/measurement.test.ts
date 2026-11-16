import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ConsentPanel } from "../components/MeasurementConsent";
import {
  CONSENT_BLOCK_KEY,
  CONSENT_MAX_AGE,
  CONSENT_STORAGE_KEY,
  CONSENT_VERSION,
  REFERRAL_STORAGE_KEY,
  MeasurementConsentController,
  cookieDeletionStrings,
  getMeasurementConfig,
  makePreference,
  parsePreference,
  referralOrigin,
  type MeasurementConfig,
} from "./measurement";

const env = {
  VITE_MEASUREMENT_ENABLED: "true",
  VITE_GA_ID: "G-ABC123",
  VITE_CLARITY_ID: "abc123",
  VITE_PRIVACY_OPERATOR: "Example Operator",
  VITE_PRIVACY_EMAIL: "privacy@example.test",
};
const both: MeasurementConfig = { gaId: "G-ABC123", clarityId: "abc123", operator: "Example Operator", email: "privacy@example.test" };
const gaOnly: MeasurementConfig = { ...both, clarityId: undefined };
const clarityOnly: MeasurementConfig = { ...both, gaId: undefined };

class FakeStorage {
  data = new Map<string, string>();
  failRead = false;
  failWrite = false;
  failRemove = false;
  getItem(key: string) { if (this.failRead) throw new Error("blocked"); return this.data.get(key) ?? null; }
  setItem(key: string, value: string) { if (this.failWrite) throw new Error("blocked"); this.data.set(key, value); }
  removeItem(key: string) { if (this.failRemove) throw new Error("blocked"); this.data.delete(key); }
}

class FakeScript {
  dataset: Record<string, string> = {};
  src = "";
  async = false;
  referrerPolicy = "";
  constructor(private owner: FakeDocument) {}
  remove() { this.owner.scripts = this.owner.scripts.filter(script => script !== this); }
}
class FakeDocument extends EventTarget {
  scripts: FakeScript[] = [];
  referrer = "";
  cookieHeader = "_ga=old; _ga_ABC123=old; _clck=old; unrelated=keep";
  cookieWrites: string[] = [];
  head = { append: (script: FakeScript) => this.scripts.push(script) };
  get cookie() { return this.cookieHeader; }
  set cookie(value: string) { this.cookieWrites.push(value); }
  createElement() { return new FakeScript(this); }
  querySelectorAll(selector: string) {
    const provider = selector.match(/="(ga|clarity)"/)?.[1];
    return this.scripts.filter(script => script.dataset.d8dMeasurement === provider);
  }
  querySelector(selector: string) { return this.querySelectorAll(selector)[0] ?? null; }
}
class FakeChannel {
  static channels: FakeChannel[] = [];
  onmessage: ((event: { data: string }) => void) | null = null;
  constructor(public name: string) { FakeChannel.channels.push(this); }
  postMessage(data: string) {
    for (const other of FakeChannel.channels) if (other !== this && other.name === this.name) other.onmessage?.({ data });
  }
  close() { FakeChannel.channels = FakeChannel.channels.filter(channel => channel !== this); }
}
let nonce = 0;
class FakeWindow extends EventTarget {
  sessionStorage = new FakeStorage();
  BroadcastChannel = FakeChannel;
  crypto = { randomUUID: () => `00000000-0000-4000-8000-${String(++nonce).padStart(12, "0")}` };
  location = { hostname: "shop.example.test", pathname: "/nested/page", origin: "https://shop.example.test", reload: vi.fn() };
  setTimeout = (callback: () => void, time: number) => setTimeout(callback, time) as unknown as number;
  clearTimeout = (id: number) => clearTimeout(id);
  dataLayer?: IArguments[];
  gtag?: (...args: unknown[]) => void;
  clarity?: ((...args: unknown[]) => void) & { q?: unknown[][] };
  constructor(public localStorage = new FakeStorage()) { super(); }
  storageEvent(key: string | null, newValue = key === null ? null : this.localStorage.getItem(key), oldValue: string | null = null) {
    const event = new Event("storage");
    Object.defineProperty(event, "key", { value: key });
    Object.defineProperty(event, "newValue", { value: newValue });
    Object.defineProperty(event, "oldValue", { value: oldValue });
    this.dispatchEvent(event);
  }
}
function controller(config = both, host = new FakeWindow(), doc = new FakeDocument()) {
  const changes: { preference: ReturnType<typeof parsePreference>; error: boolean }[] = [];
  const instance = new MeasurementConsentController(config, state => changes.push(state), host as unknown as Window, doc as unknown as Document);
  return { instance, host, doc, changes };
}
function store(host: FakeWindow, preference = makePreference(both, true, true)) {
  host.localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(preference));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-15T12:00:00Z"));
  FakeChannel.channels = [];
  nonce = 0;
});
afterEach(() => { vi.useRealTimers(); });

describe("measurement configuration", () => {
  it("is off by default even when identifiers are present or malformed", () => {
    expect(getMeasurementConfig({ ...env, VITE_MEASUREMENT_ENABLED: undefined })).toBeNull();
    expect(getMeasurementConfig({ ...env, VITE_MEASUREMENT_ENABLED: "false", VITE_GA_ID: "bad" })).toBeNull();
  });

  it("accepts either provider independently or both together", () => {
    expect(getMeasurementConfig(env)).toEqual(both);
    expect(getMeasurementConfig({ ...env, VITE_CLARITY_ID: "" })).toEqual(gaOnly);
    expect(getMeasurementConfig({ ...env, VITE_GA_ID: undefined })).toEqual(clarityOnly);
  });

  it("fails closed for invalid IDs, no IDs, and missing controller contact", () => {
    for (const change of [
      { VITE_GA_ID: "", VITE_CLARITY_ID: "" },
      { VITE_GA_ID: "UA-123" }, { VITE_GA_ID: " " },
      { VITE_CLARITY_ID: "not/a/tag" }, { VITE_CLARITY_ID: "ABC" },
      { VITE_PRIVACY_OPERATOR: " " }, { VITE_PRIVACY_EMAIL: "" }, { VITE_PRIVACY_EMAIL: "not-an-email" },
    ]) expect(() => getMeasurementConfig({ ...env, ...change })).toThrow();
  });

  it("renders only the configured providers", () => {
    const render = (measurement: MeasurementConfig) => renderToStaticMarkup(createElement(ConsentPanel, {
      measurement, analytics: false, recordings: false, error: false,
      onAnalyticsChange: () => {}, onRecordingsChange: () => {}, onReject: () => {}, onSave: () => {}, onAccept: () => {},
    }));
    expect(render(gaOnly)).toContain("Google Analytics");
    expect(render(gaOnly)).not.toContain("Clarity");
    expect(render(clarityOnly)).toContain("Clarity");
    expect(render(clarityOnly)).not.toContain("Google Analytics");
    expect(render(both)).toContain("Google Analytics");
    expect(render(both)).toContain("Clarity");
  });
});

describe("stored consent", () => {
  it("accepts only unexpired, well-formed choices bound to the same provider IDs", () => {
    const now = Date.now();
    const preference = makePreference(both, true, false, now);
    expect(parsePreference(JSON.stringify(preference), both, now + CONSENT_MAX_AGE - 1)).toEqual(preference);
    expect(parsePreference(JSON.stringify(preference), both, now + CONSENT_MAX_AGE)).toBeNull();
    expect(parsePreference(JSON.stringify(preference), both, now - 1)).toBeNull();
    expect(parsePreference("{broken", both, now)).toBeNull();
    expect(parsePreference(JSON.stringify({ analytics: true, recordings: false, savedAt: now }), both, now)).toBeNull();
    expect(parsePreference(JSON.stringify({ ...preference, savedAt: "1" }), both, now)).toBeNull();
    expect(parsePreference(JSON.stringify(preference), gaOnly, now)).toBeNull();
    expect(parsePreference(JSON.stringify(preference), { ...both, gaId: "G-NEW" }, now)).toBeNull();
    expect(parsePreference(JSON.stringify({ ...preference, version: CONSENT_VERSION - 1 }), both, now)).toBeNull();
    const { version: _version, ...legacy } = preference;
    expect(parsePreference(JSON.stringify(legacy), both, now)).toBeNull();
  });

  it("never grants an unconfigured provider, even on accept all", () => {
    expect(makePreference(gaOnly, true, true)).toMatchObject({ analytics: true, recordings: false });
    expect(makePreference(clarityOnly, true, true)).toMatchObject({ analytics: false, recordings: true });
    expect(parsePreference(JSON.stringify({ ...makePreference(gaOnly, true, false), recordings: true }), gaOnly)).toBeNull();
  });
});

describe("referral minimization", () => {
  it("keeps only an external HTTP(S) origin and drops user info, path, query and fragment", () => {
    expect(referralOrigin("https://chatgpt.com/chat/private?token=secret#id", "https://shop.example.test")).toBe("https://chatgpt.com/");
    expect(referralOrigin("https://shop.example.test/page?secret=1", "https://shop.example.test")).toBe("");
    expect(referralOrigin("https://user:password@chatgpt.com/", "https://shop.example.test")).toBe("");
    expect(referralOrigin("javascript:alert(1)", "https://shop.example.test")).toBe("");
    expect(referralOrigin("not a URL", "https://shop.example.test")).toBe("");
  });
});

describe("cookie cleanup", () => {
  it("attempts host-only and domain cookies at root and current path ancestors without touching unrelated names", () => {
    const values = cookieDeletionStrings("_ga=1; _ga_OTHER=2; _clck=3; session=secret", "shop.example.test", "/nested/page", both, { analytics: true, recordings: true });
    expect(values).toContain("_ga=; Max-Age=0; Path=/; SameSite=Lax");
    expect(values).toContain("_ga=; Max-Age=0; Path=/nested/page; Domain=example.test; SameSite=Lax");
    expect(values).toContain("_ga_OTHER=; Max-Age=0; Path=/nested/; Domain=shop.example.test; SameSite=Lax");
    expect(values).toContain("_clck=; Max-Age=0; Path=/; Domain=example.test; SameSite=Lax");
    expect(values.some(value => value.startsWith("session="))).toBe(false);
    expect(cookieDeletionStrings("_clck=x", "127.0.0.1", "/", both, { analytics: false, recordings: true }).some(v => v.includes("Domain="))).toBe(false);
  });

  it("cleans only the provider that was declined", () => {
    const values = cookieDeletionStrings("_ga=1; _clck=2", "example.test", "/", both, { analytics: false, recordings: true });
    expect(values.some(v => v.startsWith("_clck="))).toBe(true);
    expect(values.some(v => v.startsWith("_ga="))).toBe(false);
  });
});

describe("consent lifecycle", () => {
  it("loads nothing without a saved choice and reject-all cleans old cookies", () => {
    const { instance, host, doc, changes } = controller();
    instance.start();
    expect(doc.scripts).toHaveLength(0);
    expect(changes.at(-1)?.preference).toBeNull();
    instance.save(false, false);
    expect(JSON.parse(host.localStorage.getItem(CONSENT_STORAGE_KEY)!)).toMatchObject({ analytics: false, recordings: false });
    expect(doc.cookieWrites.some(v => v.startsWith("_ga="))).toBe(true);
    expect(doc.cookieWrites.some(v => v.startsWith("_clck="))).toBe(true);
    expect(host.location.reload).not.toHaveBeenCalled();
    instance.dispose();
  });

  it("loads only the specifically opted-in configured provider without passing a query", () => {
    const host = new FakeWindow();
    store(host, makePreference(both, true, false));
    const { instance, doc } = controller(both, host);
    instance.start();
    expect(doc.scripts.map(script => script.dataset.d8dMeasurement)).toEqual(["ga"]);
    expect(doc.scripts[0].referrerPolicy).toBe("no-referrer");
    expect(host.dataLayer?.every(args => Object.prototype.toString.call(args) === "[object Arguments]")).toBe(true);
    expect(host.dataLayer?.find(args => args[0] === "config")?.[2]).toMatchObject({
      send_page_view: false, page_location: "https://shop.example.test/", page_referrer: "",
    });
    expect(host.dataLayer?.find(args => args[0] === "event")?.[2]).toEqual({
      page_location: "https://shop.example.test/", page_referrer: "", page_title: "D8D Tech",
    });
    expect(doc.cookieWrites.some(v => v.startsWith("_clck="))).toBe(true);
    expect(doc.cookieWrites.some(v => v.startsWith("_ga="))).toBe(false);
    instance.dispose();
  });

  it("captures the referral origin after consent without reloading the first opt-in", () => {
    const host = new FakeWindow();
    const doc = new FakeDocument();
    doc.referrer = "https://chatgpt.com/private?prompt=secret#part";
    const first = controller(both, host, doc);
    first.instance.start();
    expect(host.sessionStorage.getItem(REFERRAL_STORAGE_KEY)).toBeNull();
    first.instance.save(true, false);
    expect(host.dataLayer?.find(args => args[0] === "config")?.[2]).toMatchObject({ page_referrer: "https://chatgpt.com/" });
    expect(host.dataLayer?.find(args => args[0] === "event")?.[2]).toMatchObject({ page_referrer: "https://chatgpt.com/" });
    expect(host.sessionStorage.getItem(REFERRAL_STORAGE_KEY)).toBeNull();
    expect(host.location.reload).not.toHaveBeenCalled();
    first.instance.dispose();
  });

  it("keeps the first opt-in referrer even if secure referral tokens are unavailable", () => {
    const host = new FakeWindow();
    host.crypto.randomUUID = () => { throw new Error("unavailable"); };
    const doc = new FakeDocument();
    doc.referrer = "https://chatgpt.com/private";
    const first = controller(both, host, doc);
    first.instance.start();
    first.instance.save(true, false);
    expect(host.dataLayer?.find(args => args[0] === "event")?.[2]).toMatchObject({ page_referrer: "https://chatgpt.com/" });
    expect(host.sessionStorage.getItem(REFERRAL_STORAGE_KEY)).toBeNull();
    expect(host.location.reload).not.toHaveBeenCalled();
    first.instance.dispose();
  });

  it("preserves a new analytics opt-in referral across a necessary provider reload", () => {
    const host = new FakeWindow();
    const doc = new FakeDocument();
    doc.referrer = "https://chatgpt.com/private?prompt=secret";
    store(host, makePreference(both, false, true));
    const first = controller(both, host, doc);
    first.instance.start();
    first.instance.save(true, true);
    expect(host.location.reload).toHaveBeenCalledOnce();
    expect(host.sessionStorage.getItem(REFERRAL_STORAGE_KEY)).not.toBeNull();
    first.instance.dispose();

    const reloadedDoc = new FakeDocument();
    reloadedDoc.referrer = "https://shop.example.test/previous";
    const reloaded = controller(both, host, reloadedDoc);
    reloaded.instance.start();
    expect(host.dataLayer?.find(args => args[0] === "event")?.[2]).toMatchObject({ page_referrer: "https://chatgpt.com/" });
    expect(host.sessionStorage.getItem(REFERRAL_STORAGE_KEY)).toBeNull();
    reloaded.instance.dispose();
  });

  it("preserves a newer opt-in referral when an older withdrawal event arrives late", () => {
    const host = new FakeWindow();
    const doc = new FakeDocument();
    doc.referrer = "https://new-referrer.example/private";
    const previous = JSON.stringify(makePreference(both, false, true));
    store(host, makePreference(both, false, true));
    const first = controller(both, host, doc);
    first.instance.start();
    first.instance.save(true, true);
    host.storageEvent(CONSENT_STORAGE_KEY, previous, null);
    expect(host.sessionStorage.getItem(REFERRAL_STORAGE_KEY)).not.toBeNull();
    first.instance.dispose();

    const reloaded = controller(both, host, new FakeDocument());
    reloaded.instance.start();
    expect(host.dataLayer?.find(args => args[0] === "event")?.[2]).toMatchObject({ page_referrer: "https://new-referrer.example/" });
    expect(host.sessionStorage.getItem(REFERRAL_STORAGE_KEY)).toBeNull();
    reloaded.instance.dispose();
  });

  it("can save and load Clarity without configuring GA4", () => {
    const host = new FakeWindow();
    const first = controller(clarityOnly, host);
    first.instance.start();
    first.instance.save(true, true);
    const persisted = JSON.parse(host.localStorage.getItem(CONSENT_STORAGE_KEY)!);
    expect(persisted).toMatchObject({ analytics: false, recordings: true });
    first.instance.dispose();
    const reopened = controller(clarityOnly, host, new FakeDocument());
    reopened.instance.start();
    expect(reopened.doc.scripts.map(script => script.dataset.d8dMeasurement)).toEqual(["clarity"]);
    expect(host.dataLayer).toBeUndefined();
    reopened.instance.dispose();
  });

  it("rejects malformed, expired, legacy, and changed-provider records without loading a tag", () => {
    for (const raw of ["{", JSON.stringify({ analytics: true, recordings: true, savedAt: Date.now() }), JSON.stringify(makePreference(gaOnly, true, false)), JSON.stringify(makePreference(both, true, true, Date.now() - CONSENT_MAX_AGE))]) {
      const host = new FakeWindow();
      host.localStorage.setItem(CONSENT_STORAGE_KEY, raw);
      const { instance, doc } = controller(both, host);
      instance.start();
      expect(doc.scripts).toHaveLength(0);
      expect(host.localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
      expect(doc.cookieWrites.some(v => v.startsWith("_ga="))).toBe(true);
      instance.dispose();
    }
  });

  it("expires live consent and stops tags without waiting for another visit", () => {
    const host = new FakeWindow();
    store(host, makePreference(both, true, true, Date.now() - CONSENT_MAX_AGE + 1000));
    const { instance, doc, changes } = controller(both, host);
    instance.start();
    expect(doc.scripts).toHaveLength(2);
    vi.advanceTimersByTime(1000);
    expect(doc.scripts).toHaveLength(0);
    expect(host.localStorage.getItem(CONSENT_STORAGE_KEY)).toBeNull();
    expect(changes.at(-1)).toEqual({ preference: null, error: false });
    expect(host.dataLayer?.some(args => args[0] === "consent" && args[1] === "update")).toBe(true);
    expect(host.location.reload).toHaveBeenCalledOnce();
    instance.dispose();
  });

  it("responds to withdrawal from another tab and clears the withdrawn provider", () => {
    const shared = new FakeStorage();
    const first = new FakeWindow(shared);
    const second = new FakeWindow(shared);
    store(first);
    const one = controller(both, first);
    const two = controller(both, second);
    one.instance.start(); two.instance.start();
    one.instance.save(false, true);
    second.storageEvent(CONSENT_STORAGE_KEY);
    expect(two.doc.cookieWrites.some(v => v.startsWith("_ga="))).toBe(true);
    expect(second.dataLayer?.some(args => args[0] === "consent" && args[1] === "update")).toBe(true);
    expect(second.location.reload).toHaveBeenCalledOnce();
    one.instance.dispose(); two.instance.dispose();
  });

  it("clears a pending referral for a delayed cross-tab withdrawal even if consent was regranted", () => {
    const host = new FakeWindow();
    const doc = new FakeDocument();
    doc.referrer = "https://old-referrer.example/private";
    store(host, makePreference(both, false, true));
    const first = controller(both, host, doc);
    first.instance.start();
    first.instance.save(true, true);
    expect(host.sessionStorage.getItem(REFERRAL_STORAGE_KEY)).not.toBeNull();

    const withdrawal = JSON.stringify(makePreference(both, false, true));
    store(host, makePreference(both, true, true));
    host.storageEvent(CONSENT_STORAGE_KEY, withdrawal);
    expect(host.sessionStorage.getItem(REFERRAL_STORAGE_KEY)).toBeNull();
    first.instance.dispose();
  });

  it("clears a pending referral when a withdrawal event identifies its grant as the old value", () => {
    const host = new FakeWindow();
    const doc = new FakeDocument();
    doc.referrer = "https://old-referrer.example/private";
    store(host, makePreference(both, false, true));
    const first = controller(both, host, doc);
    first.instance.start();
    first.instance.save(true, true);
    const withdrawnGrant = host.localStorage.getItem(CONSENT_STORAGE_KEY);
    expect(host.sessionStorage.getItem(REFERRAL_STORAGE_KEY)).not.toBeNull();

    // Even a restored copy of that same grant must not preserve its withdrawn referral.
    host.storageEvent(CONSENT_STORAGE_KEY, JSON.stringify(makePreference(both, false, true)), withdrawnGrant);
    expect(host.sessionStorage.getItem(REFERRAL_STORAGE_KEY)).toBeNull();
    first.instance.dispose();
  });

  it("does not reuse a pending referral after an unobserved withdrawal and later grant", () => {
    const shared = new FakeStorage();
    const firstHost = new FakeWindow(shared);
    const secondHost = new FakeWindow(shared);
    const firstDoc = new FakeDocument();
    firstDoc.referrer = "https://old-referrer.example/private";
    store(firstHost, makePreference(both, false, true));
    const first = controller(both, firstHost, firstDoc);
    const second = controller(both, secondHost);
    first.instance.start(); second.instance.start();
    first.instance.save(true, true);
    expect(firstHost.sessionStorage.getItem(REFERRAL_STORAGE_KEY)).not.toBeNull();
    // Simulate the first document unloading before either cross-tab event arrives.
    first.instance.dispose();
    second.instance.save(false, true);
    second.instance.save(true, true);
    second.instance.dispose();

    const reloadedDoc = new FakeDocument();
    // Even a browser that retains the old external document.referrer must not reuse it.
    reloadedDoc.referrer = "https://old-referrer.example/private";
    const reloaded = controller(both, firstHost, reloadedDoc);
    reloaded.instance.start();
    expect(firstHost.dataLayer?.find(args => args[0] === "event")?.[2]).toMatchObject({ page_referrer: "" });
    expect(firstHost.sessionStorage.getItem(REFERRAL_STORAGE_KEY)).toBeNull();
    reloaded.instance.dispose();
  });

  it("does not reuse a referral when session storage could not remove it during withdrawal", () => {
    const shared = new FakeStorage();
    const firstHost = new FakeWindow(shared);
    const secondHost = new FakeWindow(shared);
    const firstDoc = new FakeDocument();
    firstDoc.referrer = "https://old-referrer.example/private";
    store(firstHost, makePreference(both, false, true));
    const first = controller(both, firstHost, firstDoc);
    const second = controller(both, secondHost);
    first.instance.start(); second.instance.start();
    first.instance.save(true, true);
    firstHost.sessionStorage.failRemove = true;
    second.instance.save(false, true);
    firstHost.storageEvent(CONSENT_STORAGE_KEY);
    expect(firstHost.sessionStorage.getItem(REFERRAL_STORAGE_KEY)).not.toBeNull();
    first.instance.dispose();
    firstHost.sessionStorage.failRemove = false;
    second.instance.save(true, true);
    second.instance.dispose();

    const reloaded = controller(both, firstHost, new FakeDocument());
    reloaded.instance.start();
    expect(firstHost.dataLayer?.find(args => args[0] === "event")?.[2]).toMatchObject({ page_referrer: "" });
    expect(firstHost.sessionStorage.getItem(REFERRAL_STORAGE_KEY)).toBeNull();
    reloaded.instance.dispose();
  });

  it.each(["withdrawn", "invalid", "unavailable"])("clears a pending referral when consent is %s", reason => {
    const host = new FakeWindow();
    const doc = new FakeDocument();
    doc.referrer = "https://old-referrer.example/private";
    store(host, makePreference(both, false, true));
    const first = controller(both, host, doc);
    first.instance.start();
    first.instance.save(true, true);
    expect(host.sessionStorage.getItem(REFERRAL_STORAGE_KEY)).not.toBeNull();
    if (reason === "withdrawn") store(host, makePreference(both, false, true));
    if (reason === "invalid") host.localStorage.setItem(CONSENT_STORAGE_KEY, "invalid");
    if (reason === "unavailable") host.localStorage.failRead = true;
    host.dispatchEvent(new Event("focus"));
    expect(host.sessionStorage.getItem(REFERRAL_STORAGE_KEY)).toBeNull();
    first.instance.dispose();
  });

  it("fails closed on storage read failure", () => {
    const host = new FakeWindow();
    host.localStorage.failRead = true;
    const { instance, doc, changes } = controller(both, host);
    instance.start();
    expect(doc.scripts).toHaveLength(0);
    expect(changes.at(-1)).toEqual({ preference: null, error: true });
    expect(host.sessionStorage.getItem(CONSENT_BLOCK_KEY)).toBe("1");
    instance.dispose();
  });

  it("does not load a stored grant when session storage is unavailable", () => {
    const host = new FakeWindow();
    store(host);
    host.sessionStorage.failRead = true;
    const { instance, doc, changes } = controller(both, host);
    instance.start();
    expect(doc.scripts).toHaveLength(0);
    expect(changes.at(-1)?.error).toBe(true);
    instance.dispose();
  });

  it("withdraws, guards reload and notifies other tabs even when localStorage write and removal fail", () => {
    const shared = new FakeStorage();
    const first = new FakeWindow(shared);
    const second = new FakeWindow(shared);
    store(first);
    const one = controller(both, first);
    const two = controller(both, second);
    one.instance.start(); two.instance.start();
    first.sessionStorage.setItem(REFERRAL_STORAGE_KEY, "stale");
    second.sessionStorage.setItem(REFERRAL_STORAGE_KEY, "stale");
    shared.failWrite = true;
    shared.failRemove = true;
    one.instance.save(false, false);
    expect(one.doc.scripts).toHaveLength(0);
    expect(two.doc.scripts).toHaveLength(0);
    expect(first.sessionStorage.getItem(CONSENT_BLOCK_KEY)).toBe("1");
    expect(second.sessionStorage.getItem(CONSENT_BLOCK_KEY)).toBe("1");
    expect(first.sessionStorage.getItem(REFERRAL_STORAGE_KEY)).toBeNull();
    expect(second.sessionStorage.getItem(REFERRAL_STORAGE_KEY)).toBeNull();
    expect(first.location.reload).toHaveBeenCalledOnce();
    expect(second.location.reload).toHaveBeenCalledOnce();
    expect(one.changes.at(-1)).toEqual({ preference: null, error: true });
    one.instance.dispose(); two.instance.dispose();
    const afterReload = controller(both, first, new FakeDocument());
    afterReload.instance.start();
    expect(afterReload.doc.scripts).toHaveLength(0);
    afterReload.instance.dispose();
  });

  it("does not reload into a stale grant if all persistence mechanisms fail", () => {
    const host = new FakeWindow();
    store(host);
    const { instance, doc, changes } = controller(both, host);
    instance.start();
    host.localStorage.failWrite = true;
    host.localStorage.failRemove = true;
    host.sessionStorage.failWrite = true;
    instance.save(false, false);
    expect(doc.scripts).toHaveLength(0);
    expect(host.location.reload).not.toHaveBeenCalled();
    expect(changes.at(-1)?.error).toBe(true);
    host.dispatchEvent(new Event("focus"));
    expect(doc.scripts).toHaveLength(0);
    expect(changes.at(-1)?.preference).toBeNull();
    instance.dispose();
  });

  it("reloads after a rejection retry when provider code may still be resident", () => {
    const host = new FakeWindow();
    store(host);
    const { instance, doc, changes } = controller(both, host);
    instance.start();
    expect(doc.scripts).toHaveLength(2);
    host.localStorage.failWrite = true;
    host.localStorage.failRemove = true;
    host.sessionStorage.failWrite = true;
    instance.save(false, false);
    expect(host.location.reload).not.toHaveBeenCalled();
    expect(changes.at(-1)?.error).toBe(true);
    expect(doc.scripts).toHaveLength(0);

    host.localStorage.failWrite = false;
    host.localStorage.failRemove = false;
    host.sessionStorage.failWrite = false;
    instance.save(false, false);
    expect(JSON.parse(host.localStorage.getItem(CONSENT_STORAGE_KEY)!)).toMatchObject({ analytics: false, recordings: false });
    expect(host.location.reload).toHaveBeenCalledOnce();
    expect(changes.at(-1)?.error).toBe(true);
    // A delayed or cancelled navigation must not turn the warning into a false success.
    host.dispatchEvent(new Event("focus"));
    expect(changes.at(-1)).toEqual({ preference: null, error: true });
    expect(host.location.reload).toHaveBeenCalledTimes(2);
    expect(doc.scripts).toHaveLength(0);
    instance.dispose();
  });

  it("does not restore an old grant on focus when a cross-tab guard cannot be stored", () => {
    const shared = new FakeStorage();
    const first = new FakeWindow(shared);
    const second = new FakeWindow(shared);
    store(first);
    const one = controller(both, first);
    const two = controller(both, second);
    one.instance.start(); two.instance.start();
    shared.failWrite = true;
    shared.failRemove = true;
    second.sessionStorage.failWrite = true;
    one.instance.save(false, false);
    expect(two.doc.scripts).toHaveLength(0);
    expect(second.location.reload).not.toHaveBeenCalled();
    second.dispatchEvent(new Event("focus"));
    expect(two.doc.scripts).toHaveLength(0);
    expect(two.changes.at(-1)?.error).toBe(true);
    one.instance.dispose();
    two.instance.dispose();
  });
});
