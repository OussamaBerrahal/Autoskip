import { describe, expect, it } from "vitest";
import { resolvePreferences, shouldAutomate, upsertRule, setServiceEnabled } from "../src/rules/engine";
import { DEFAULT_STATE } from "../src/types";

describe("rules engine", () => {
  it("resolves service < series < session specificity", () => {
    let state = structuredClone(DEFAULT_STATE);
    state = upsertRule(state, "service", "netflix", null, null, { intro: true });
    state = upsertRule(state, "series", "netflix", "got", "Game of Thrones", {
      intro: false,
    });
    state = upsertRule(state, "session", "netflix", "got", "Game of Thrones", {
      intro: true,
    });

    expect(resolvePreferences(state, "netflix", "got").intro).toBe(true);
    expect(shouldAutomate(state, "netflix", "got", "intro")).toBe(true);
  });

  it("uses series override over service default", () => {
    let state = structuredClone(DEFAULT_STATE);
    state = upsertRule(state, "service", "netflix", null, null, { intro: true });
    state = upsertRule(state, "series", "netflix", "got", "Game of Thrones", {
      intro: false,
    });

    expect(resolvePreferences(state, "netflix", "got").intro).toBe(false);
    expect(resolvePreferences(state, "netflix", "bcs").intro).toBe(true);
  });

  it("falls back to service when series scope lacks an id", () => {
    let state = structuredClone(DEFAULT_STATE);
    state = upsertRule(state, "series", "netflix", null, null, { intro: true });
    expect(state.serviceRules.netflix?.preferences.intro).toBe(true);
  });

  it("disables automation when extension or service is off", () => {
    let state = structuredClone(DEFAULT_STATE);
    state = upsertRule(state, "service", "netflix", null, null, { intro: true });
    state.enabled = false;
    expect(shouldAutomate(state, "netflix", "x", "intro")).toBe(false);

    state = structuredClone(DEFAULT_STATE);
    state = upsertRule(state, "service", "netflix", null, null, { intro: true });
    state = setServiceEnabled(state, "netflix", false);
    expect(shouldAutomate(state, "netflix", "x", "intro")).toBe(false);
  });
});
