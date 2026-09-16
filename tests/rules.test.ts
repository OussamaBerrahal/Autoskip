import { describe, expect, it } from "vitest";
import {
  resolvePreferences,
  shouldAutomate,
  upsertRule,
  setServiceEnabled,
} from "../src/rules/engine";
import { DEFAULT_STATE } from "../src/types";

describe("rules engine", () => {
  it("resolves service < series < session specificity", () => {
    let state = structuredClone(DEFAULT_STATE);
    state = upsertRule(state, "service", "netflix", null, null, {
      intro: true,
    });
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
    state = upsertRule(state, "service", "netflix", null, null, {
      intro: true,
    });
    state = upsertRule(state, "series", "netflix", "got", "Game of Thrones", {
      intro: false,
    });

    expect(resolvePreferences(state, "netflix", "got").intro).toBe(false);
    expect(resolvePreferences(state, "netflix", "bcs").intro).toBe(true);
  });

  it("does not widen a series rule when its id is unknown", () => {
    let state = structuredClone(DEFAULT_STATE);
    state = upsertRule(state, "series", "netflix", null, null, { intro: true });
    expect(state.serviceRules.netflix).toBeUndefined();
  });

  it("disables automation when extension or service is off", () => {
    let state = structuredClone(DEFAULT_STATE);
    state = upsertRule(state, "service", "netflix", null, null, {
      intro: true,
    });
    state.enabled = false;
    expect(shouldAutomate(state, "netflix", "x", "intro")).toBe(false);

    state = structuredClone(DEFAULT_STATE);
    state = upsertRule(state, "service", "netflix", null, null, {
      intro: true,
    });
    state = setServiceEnabled(state, "netflix", false);
    expect(shouldAutomate(state, "netflix", "x", "intro")).toBe(false);
  });
});

it("keeps unrelated service preferences when one series/session action changes", () => {
  let state = upsertRule(
    structuredClone(DEFAULT_STATE),
    "service",
    "netflix",
    null,
    null,
    { intro: true, recap: true },
  );
  state = upsertRule(state, "series", "netflix", "show", "Show", {
    intro: false,
  });
  expect(resolvePreferences(state, "netflix", "show")).toMatchObject({
    intro: false,
    recap: true,
  });
  state = upsertRule(state, "session", "netflix", "show", "Show", {
    credits: false,
  });
  expect(resolvePreferences(state, "netflix", "show").recap).toBe(true);
});

it("a temporary global pause expires without changing saved choices", () => {
  const state = structuredClone(DEFAULT_STATE);
  state.serviceRules.netflix = {
    serviceId: "netflix",
    preferences: { intro: true },
    updatedAt: Date.now(),
  };
  state.pausedUntil = Date.now() + 30 * 60000;
  expect(resolvePreferences(state, "netflix", null).intro).toBe(false);
  state.pausedUntil = Date.now() - 1;
  expect(resolvePreferences(state, "netflix", null).intro).toBe(true);
  state.enabled = false;
  expect(resolvePreferences(state, "netflix", null).intro).toBe(false);
});
