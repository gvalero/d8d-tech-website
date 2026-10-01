export type MeasurementConfig = {
  gaId: string;
  clarityId: string;
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

  const { VITE_GA_ID: gaId, VITE_CLARITY_ID: clarityId, VITE_PRIVACY_OPERATOR: operator, VITE_PRIVACY_EMAIL: email } = env;
  if (!gaId || !/^G-[A-Z0-9]+$/.test(gaId) || !clarityId || !/^[a-z0-9]+$/.test(clarityId) ||
      !operator?.trim() || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Measurement requires valid GA4 and Clarity IDs plus a confirmed privacy operator and contact email");
  }
  return { gaId, clarityId, operator: operator.trim(), email };
}
