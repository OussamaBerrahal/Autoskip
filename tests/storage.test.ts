import { describe, it, expect } from "vitest";
import { applyMutation } from "../src/storage/mutations";
import { validateImport } from "../src/storage/validation";
import { DEFAULT_STATE } from "../src/types";
import { resolvePreferences, upsertRule } from "../src/rules/engine";

describe("state mutations and imports", () => {
  it("round trips exported preferences and rejects malformed nested values", () => {
    const state = upsertRule(
      structuredClone(DEFAULT_STATE),
      "series",
      "netflix",
      "title:show",
      "Show",
      { intro: true },
    );
    expect(validateImport(JSON.parse(JSON.stringify(state)))).toEqual(state);
    expect(() =>
      validateImport({
        ...state,
        serviceRules: {
          netflix: {
            serviceId: "netflix",
            preferences: { intro: "false" },
            updatedAt: 1,
          },
        },
      }),
    ).toThrow();
    expect(() => validateImport({ enabled: "false" })).toThrow();
    expect(() => validateImport({ stats: { intros: -1 } })).toThrow();
    expect(() =>
      validateImport({
        seriesRules: {
          "netflix::a": {
            serviceId: "netflix",
            seriesId: "b",
            preferences: { intro: true },
            updatedAt: 1,
          },
        },
      }),
    ).toThrow();
  });
  it("reverses only the skipped action and retains inherited preferences", () => {
    let state = upsertRule(
      structuredClone(DEFAULT_STATE),
      "service",
      "netflix",
      null,
      null,
      { intro: true, recap: true },
    );
    state = applyMutation(state, { kind: "skip", action: "intro" });
    state = applyMutation(state, {
      kind: "pause",
      serviceId: "netflix",
      seriesId: "show",
      seriesTitle: "Show",
      action: "intro",
      reversed: true,
    });
    expect(state.stats.intros).toBe(0);
    expect(state.stats.estimatedMsSaved).toBe(0);
    expect(resolvePreferences(state, "netflix", "show")).toMatchObject({
      intro: false,
      recap: true,
    });
    state = applyMutation(state, {
      kind: "clear-session",
      serviceId: "netflix",
      seriesId: "show",
    });
    expect(resolvePreferences(state, "netflix", "show").intro).toBe(true);
  });
  it("clears session pauses at browser startup and ignores expired overrides", () => {
    let state = upsertRule(
      structuredClone(DEFAULT_STATE),
      "service",
      "netflix",
      null,
      null,
      { intro: true },
    );
    state = upsertRule(state, "session", "netflix", null, null, {
      intro: false,
    });
    state.sessionRules["netflix::unknown"]!.expiresAt = Date.now() - 1;
    expect(resolvePreferences(state, "netflix", null).intro).toBe(true);
    state = applyMutation(state, { kind: "reset", target: "startup" });
    expect(state.sessionRules).toEqual({});
    expect(state.serviceRules.netflix.preferences.intro).toBe(true);
  });
});

it("quick setup changes only intros/recaps on selected apps and preserves show overrides", () => {
  let state = upsertRule(
    structuredClone(DEFAULT_STATE),
    "service",
    "netflix",
    null,
    null,
    { credits: true },
  );
  state = upsertRule(state, "series", "netflix", "friends", "Friends", {
    intro: false,
  });
  const next = applyMutation(state, { kind: "setup", serviceIds: ["netflix"] });
  expect(next.serviceRules.netflix.preferences).toEqual({
    intro: true,
    recap: true,
    credits: true,
  });
  expect(next.enabled).toBe(true);
  expect(next.pausedUntil).toBe(0);
  expect(next.seriesRules).toEqual(state.seriesRules);
  expect(next.serviceRules["prime-video"]).toBeUndefined();
});

it("loads older backups without a pause and validates pause timestamps", () => {
  const old = { ...DEFAULT_STATE } as Partial<typeof DEFAULT_STATE>;
  delete old.pausedUntil;
  expect(validateImport(old).pausedUntil).toBe(0);
  expect(() => validateImport({ ...old, pausedUntil: "later" })).toThrow();
  expect(() => validateImport({ ...old, pausedUntil: -1 })).toThrow();
});

it("saving a show captures persistent choices, preserves existing rules, and never widens unknown shows", () => {
  const state = upsertRule(
    structuredClone(DEFAULT_STATE),
    "service",
    "netflix",
    null,
    null,
    { intro: true, recap: true },
  );
  state.enabled = false;
  state.pausedUntil = Date.now() + 60000;
  state.services.netflix.enabled = false;
  state.sessionRules["netflix::friends"] = {
    serviceId: "netflix",
    seriesId: "friends",
    preferences: { intro: false },
    updatedAt: Date.now(),
  };
  const mutation = {
    kind: "save-series" as const,
    serviceId: "netflix" as const,
    seriesId: "friends",
    seriesTitle: "Friends",
  };
  const saved = applyMutation(state, mutation);
  expect(saved.seriesRules["netflix::friends"].preferences).toEqual({
    intro: true,
    recap: true,
    credits: false,
    stillWatching: false,
  });
  const edited = upsertRule(saved, "series", "netflix", "friends", "Friends", {
    intro: false,
  });
  expect(applyMutation(edited, mutation)).toEqual(edited);
  expect(applyMutation(state, { ...mutation, seriesId: null })).toEqual(state);
  expect(saved.serviceRules).toEqual(state.serviceRules);
  expect(saved.sessionRules).toEqual(state.sessionRules);
});
