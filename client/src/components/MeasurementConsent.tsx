import { useEffect, useRef, useState } from "react";
import {
  getMeasurementConfig,
  MeasurementConsentController,
  type MeasurementConfig,
  type MeasurementPreference,
  type ConsentState,
} from "@/lib/measurement";

// A bad future configuration must not break the rest of the site or load a provider.
const config = (() => {
  // This compile-time guard keeps disabled bundles free of optional privacy details.
  if (import.meta.env.VITE_MEASUREMENT_ENABLED !== "true") return null;
  try {
    return getMeasurementConfig({
      VITE_MEASUREMENT_ENABLED: import.meta.env.VITE_MEASUREMENT_ENABLED,
      VITE_GA_ID: import.meta.env.VITE_GA_ID,
      VITE_CLARITY_ID: import.meta.env.VITE_CLARITY_ID,
      VITE_PRIVACY_OPERATOR: import.meta.env.VITE_PRIVACY_OPERATOR,
      VITE_PRIVACY_EMAIL: import.meta.env.VITE_PRIVACY_EMAIL,
    });
  } catch {
    console.error("Measurement is disabled because its configuration is invalid.");
    return null;
  }
})();
export const measurementConfigured = config !== null;

// The Home component can unmount during client-side navigation while vendor code
// remains in the document. Keep its expiry and cross-tab listeners until unload.
let pageController: MeasurementConsentController | null = null;
let pageState: ConsentState | null = null;
let pageListener: (state: ConsentState) => void = () => {};

function ConsentControls({ measurement }: { measurement: MeasurementConfig }) {
  const [saved, setSaved] = useState<MeasurementPreference | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [recordings, setRecordings] = useState(false);
  const [error, setError] = useState(false);
  const controller = useRef<MeasurementConsentController | null>(null);

  useEffect(() => {
    pageListener = state => {
      setSaved(state.preference);
      setAnalytics(state.preference?.analytics ?? false);
      setRecordings(state.preference?.recordings ?? false);
      setError(state.error);
    };
    if (!pageController) {
      pageController = new MeasurementConsentController(measurement, state => {
        pageState = state;
        pageListener(state);
      });
      pageController.start();
    } else if (pageState) {
      pageListener(pageState);
    }
    controller.current = pageController;
    return () => {
      pageListener = () => {};
      controller.current = null;
    };
  }, [measurement]);

  if (saved === undefined) return null;
  if (saved && !editing) {
    return <button className="measurement-settings" type="button" onClick={() => setEditing(true)}>Privacy settings</button>;
  }

  return <ConsentPanel
    measurement={measurement}
    analytics={analytics}
    recordings={recordings}
    error={error}
    onAnalyticsChange={setAnalytics}
    onRecordingsChange={setRecordings}
    onReject={() => { controller.current?.save(false, false); setEditing(false); }}
    onSave={() => { controller.current?.save(analytics, recordings); setEditing(false); }}
    onAccept={() => { controller.current?.save(true, true); setEditing(false); }}
  />;
}

export function ConsentPanel({ measurement, analytics, recordings, error, onAnalyticsChange, onRecordingsChange, onReject, onSave, onAccept }: {
  measurement: MeasurementConfig;
  analytics: boolean;
  recordings: boolean;
  error: boolean;
  onAnalyticsChange: (value: boolean) => void;
  onRecordingsChange: (value: boolean) => void;
  onReject: () => void;
  onSave: () => void;
  onAccept: () => void;
}) {
  const descriptions = [
    measurement.gaId && "Google Analytics to understand visits",
    measurement.clarityId && "Microsoft Clarity for interaction recordings",
  ].filter(Boolean).join(" and ");

  return (
    <aside className="measurement-consent" aria-label="Privacy choices">
      <h2>Privacy choices</h2>
      <p>Optional measurement uses {descriptions}. Each provider loads only if you choose it. Read our <a href="/privacy.html">privacy notice</a> for details.</p>
      {measurement.clarityId && <p>Microsoft may also use Clarity data to create advertising profiles, as described in its <a href="https://privacy.microsoft.com/en-us/privacystatement">privacy statement</a>.</p>}
      {measurement.gaId && <label><input type="checkbox" checked={analytics} onChange={(event) => onAnalyticsChange(event.target.checked)} /> Google Analytics</label>}
      {measurement.clarityId && <label><input type="checkbox" checked={recordings} onChange={(event) => onRecordingsChange(event.target.checked)} /> Clarity recordings and Microsoft data use</label>}
      <p>If you decline or withdraw, we attempt to remove accessible measurement cookies. Some cookies or provider data may need to be removed through your browser or the provider.</p>
      {error && <p role="alert">Your preference could not be reliably saved or read. We have asked optional measurement to stop, but an already-loaded provider may continue. Close other tabs and check your browser storage or clear site data before trying again.</p>}
      <div className="measurement-consent__actions">
        <button type="button" onClick={onReject}>Reject all</button>
        <button type="button" onClick={onSave}>Save choices</button>
        <button type="button" onClick={onAccept}>Accept all</button>
      </div>
    </aside>
  );
}

export default function MeasurementConsent() {
  return config ? <ConsentControls measurement={config} /> : null;
}
