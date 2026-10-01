import { describe, expect, it } from "vitest";
import { getMeasurementConfig } from "./measurement";

const complete = {
  VITE_MEASUREMENT_ENABLED: "true",
  VITE_GA_ID: "G-ABC123",
  VITE_CLARITY_ID: "abc123",
  VITE_PRIVACY_OPERATOR: "Example Operator",
  VITE_PRIVACY_EMAIL: "privacy@example.test",
};

describe("measurement configuration", () => {
  it("does not enable tracking just because IDs exist", () => {
    expect(getMeasurementConfig({ ...complete, VITE_MEASUREMENT_ENABLED: undefined })).toBeNull();
  });

  it("requires real IDs and controller contact before activation", () => {
    for (const field of ["VITE_GA_ID", "VITE_CLARITY_ID", "VITE_PRIVACY_OPERATOR", "VITE_PRIVACY_EMAIL"] as const) {
      expect(() => getMeasurementConfig({ ...complete, [field]: "" })).toThrow();
    }
    expect(() => getMeasurementConfig({ ...complete, VITE_GA_ID: "UA-123" })).toThrow();
  });

  it("accepts a complete explicitly enabled configuration", () => {
    expect(getMeasurementConfig(complete)).toEqual({
      gaId: "G-ABC123",
      clarityId: "abc123",
      operator: "Example Operator",
      email: "privacy@example.test",
    });
  });
});
