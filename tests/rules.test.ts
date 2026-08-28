import { describe, expect, it } from "vitest";
import { resolvePreferences, shouldAutomate, upsertRule } from "../src/rules/engine";
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

  it("disables all automation when extension is off", () => {
    let state = structuredClone(DEFAULT_STATE);
    state = upsertRule(state, "service", "netflix", null, null, { intro: true });
    state.enabled = false;
    expect(shouldAutomate(state, "netflix", "x", "intro")).toBe(false);
  });
});
