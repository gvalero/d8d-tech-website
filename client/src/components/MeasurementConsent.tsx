import { useEffect, useState } from "react";
import { getMeasurementConfig, type MeasurementConfig } from "@/lib/measurement";

type Preference = { analytics: boolean; recordings: boolean; savedAt: number };
type Clarity = ((...args: unknown[]) => void) & { q?: unknown[][] };

declare global {
  interface Window {
    dataLayer?: unknown[][];
    gtag?: (...args: unknown[]) => void;
    clarity?: Clarity;
  }
}

const config = getMeasurementConfig({
  VITE_MEASUREMENT_ENABLED: import.meta.env.VITE_MEASUREMENT_ENABLED,
  VITE_GA_ID: import.meta.env.VITE_GA_ID,
  VITE_CLARITY_ID: import.meta.env.VITE_CLARITY_ID,
  VITE_PRIVACY_OPERATOR: import.meta.env.VITE_PRIVACY_OPERATOR,
  VITE_PRIVACY_EMAIL: import.meta.env.VITE_PRIVACY_EMAIL,
});
const storageKey = "d8d-measurement-consent";
const maxAge = 180 * 24 * 60 * 60 * 1000;

function readPreference(): Preference | null {
  const stored = localStorage.getItem(storageKey);
  if (!stored) return null;
  const preference: unknown = JSON.parse(stored);
  if (typeof preference !== "object" || preference === null ||
      !("analytics" in preference) || typeof preference.analytics !== "boolean" ||
      !("recordings" in preference) || typeof preference.recordings !== "boolean" ||
      !("savedAt" in preference) || typeof preference.savedAt !== "number" ||
      preference.savedAt > Date.now() || Date.now() - preference.savedAt > maxAge) return null;
  return preference as Preference;
}

function clearMeasurementCookies() {
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.trim().split("=")[0];
    if (name === "_ga" || name.startsWith("_ga_") || name === "_clck" || name === "_clsk") {
      document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
    }
  }
}

function loadMeasurement(preference: Preference, { gaId, clarityId }: MeasurementConfig) {
  if (preference.analytics) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = (...args) => window.dataLayer!.push(args);
    window.gtag("consent", "default", { analytics_storage: "granted", ad_storage: "denied" });
    window.gtag("js", new Date());
    window.gtag("config", gaId);
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    script.onerror = () => console.error("Google Analytics could not be loaded");
    document.head.append(script);
  }
  if (preference.recordings) {
    const clarity: Clarity = (...args) => { (clarity.q ??= []).push(args); };
    window.clarity = clarity;
    clarity("consentv2", { ad_Storage: "denied", analytics_Storage: "granted" });
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.clarity.ms/tag/${clarityId}`;
    script.onerror = () => console.error("Microsoft Clarity could not be loaded");
    document.head.append(script);
  }
}

function ConsentControls({ measurement }: { measurement: MeasurementConfig }) {
  const [saved, setSaved] = useState<Preference | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [recordings, setRecordings] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    try {
      const preference = readPreference();
      setSaved(preference);
      if (preference) {
        setAnalytics(preference.analytics);
        setRecordings(preference.recordings);
        loadMeasurement(preference, measurement);
      }
    } catch (cause) {
      console.error("Measurement preferences could not be read", cause);
      setError(true);
      setSaved(null);
    }
  }, [measurement]);

  function save(nextAnalytics: boolean, nextRecordings: boolean) {
    const preference = { analytics: nextAnalytics, recordings: nextRecordings, savedAt: Date.now() };
    try {
      localStorage.setItem(storageKey, JSON.stringify(preference));
    } catch (cause) {
      console.error("Measurement preferences could not be saved", cause);
      setError(true);
      return;
    }
    if (saved?.analytics && !nextAnalytics) {
      window.gtag?.("consent", "update", { analytics_storage: "denied", ad_storage: "denied" });
    }
    if (saved?.recordings && !nextRecordings) {
      window.clarity?.("consentv2", { ad_Storage: "denied", analytics_Storage: "denied" });
      window.clarity?.("consent", false);
    }
    if ((saved?.analytics && !nextAnalytics) || (saved?.recordings && !nextRecordings)) clearMeasurementCookies();
    window.location.reload();
  }

  if (saved === undefined) return null;
  if (saved && !editing) {
    return <button className="measurement-settings" type="button" onClick={() => setEditing(true)}>Privacy settings</button>;
  }

  return (
    <aside className="measurement-consent" aria-label="Privacy choices">
      <h2>Privacy choices</h2>
      <p>We use optional Google Analytics to understand visits and Microsoft Clarity to view interaction recordings. Neither loads unless you choose it. Read our <a href="/privacy.html">privacy notice</a> for details.</p>
      <label><input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} /> Google Analytics</label>
      <label><input type="checkbox" checked={recordings} onChange={(event) => setRecordings(event.target.checked)} /> Clarity recordings</label>
      {error && <p role="alert">Your preference could not be saved. Please check your browser storage settings.</p>}
      <div className="measurement-consent__actions">
        <button type="button" onClick={() => save(false, false)}>Reject all</button>
        <button type="button" onClick={() => save(analytics, recordings)}>Save choices</button>
        <button type="button" onClick={() => save(true, true)}>Accept all</button>
      </div>
    </aside>
  );
}

export default function MeasurementConsent() {
  return config ? <ConsentControls measurement={config} /> : null;
}
